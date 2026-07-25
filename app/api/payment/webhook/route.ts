import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchInvoiceStatus, verifyWebhookAuth, type LavaWebhookEvent } from '@/lib/lava';
import { sendVpnKeyEmail, sendRenewalEmail } from '@/lib/mailer';
import { issueVpnKey } from '@/lib/vpn';

/**
 * Вебхук lava.top. В кабинете должны быть заведены ДВА вебхука на этот URL:
 *   «Результат платежа»  → payment.success / payment.failed (первый платёж)
 *   «Регулярный платёж»  → subscription.recurring.payment.* (продления)
 * Аутентификация обоих: Basic, login/pass в LAVA_WEBHOOK_LOGIN/PASSWORD.
 *
 * Отличия от старой ЮKassa-версии, кроме провайдера:
 *  - SELECT ... FOR UPDATE: два параллельных вебхука больше не проходят
 *    проверку идемпотентности одновременно;
 *  - статус payments выставляется в succeeded ТОЛЬКО после успешной выдачи
 *    ключа. Упала выдача → строка остаётся pending → lava ретраит вебхук →
 *    повторная попытка. Раньше ключ в этом сценарии терялся навсегда.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!verifyWebhookAuth(auth)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const event = (await req.json().catch(() => null)) as LavaWebhookEvent | null;
  if (!event?.eventType || !event.contractId) {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }

  switch (event.eventType) {
    case 'payment.success':
      return handleFirstPayment(event);
    case 'subscription.recurring.payment.success':
      return handleRenewal(event);
    case 'subscription.recurring.payment.failed':
      // lava сама ретраит списание (+8ч, +24ч) и после третьей неудачи
      // пришлёт subscription.cancelled — здесь ничего не делаем
      return NextResponse.json({ ok: true });
    case 'subscription.cancelled':
      return handleCancelled(event);
    default:
      return NextResponse.json({ ok: true });
  }
}

// -------------------------------------------------- первый платёж подписки

async function handleFirstPayment(event: LavaWebhookEvent) {
  // Телу не доверяем — перепроверяем статус в самой lava (как было с ЮKassa)
  let invoice;
  try {
    invoice = await fetchInvoiceStatus(event.contractId);
  } catch (e) {
    console.error('lava fetchInvoiceStatus failed:', e);
    return NextResponse.json({ error: 'status check failed' }, { status: 502 });
  }
  if (invoice.status !== 'COMPLETED') {
    return NextResponse.json({ ok: true });
  }

  const claimed = await sql.begin(async (tx) => {
    const rows = await tx`
      SELECT id, user_id, tarif_id, status FROM payments
      WHERE provider_payment_id = ${event.contractId}
      FOR UPDATE
    `;
    const p = rows[0];
    if (!p) return { kind: 'not_found' as const };
    if (p.status === 'succeeded') return { kind: 'done' as const };
    return { kind: 'claim' as const, p };
  });

  if (claimed.kind === 'not_found') {
    // Инвойс создавали мы — строка обязана быть. Нет строки = платёж мимо
    // нашего create (например, вручную через страницу lava): в MVP не
    // обрабатываем автоматически, только логируем для ручного матчинга.
    console.error(`lava webhook: неизвестный contractId ${event.contractId}`);
    return NextResponse.json({ ok: true });
  }
  if (claimed.kind === 'done') {
    return NextResponse.json({ ok: true }); // идемпотентность
  }

  const paymentRow = claimed.p;
  const tarifRows = await sql`
    SELECT id, name, price_rub, duration_days FROM tarifs WHERE id = ${paymentRow.tarif_id}
  `;
  const tarif = tarifRows[0];
  const userId = paymentRow.user_id as number;

  // Сумму назначает оффер lava, не мы — расхождение с тарифом значит,
  // что оффер в кабинете и БД разъехались. Не блокируем, но кричим.
  if (invoice.receipt && Number(invoice.receipt.amount) !== Number(tarif.price_rub)) {
    console.error(
      `lava: сумма инвойса ${invoice.receipt.amount} != tarifs.price_rub ${tarif.price_rub} (contractId=${event.contractId})`
    );
  }

  // Выдача ключа ДО пометки платежа succeeded: если упадёт — вернём 502,
  // lava ретрайнет вебхук, и попытка повторится (в старом коде ЮKassa
  // порядок был обратный и ключ терялся).
  let vpnKey: string;
  try {
    vpnKey = await issueVpnKey(userId, tarif.id as number);
  } catch (e) {
    console.error('issueVpnKey failed, ждём ретрая вебхука:', e);
    return NextResponse.json({ error: 'key issue failed' }, { status: 502 });
  }

  await sql`
    UPDATE users SET
      tarif_id = ${tarif.id},
      status = 'active',
      subscription_expires_at = NOW() + (${tarif.duration_days} || ' days')::interval,
      vpn_key = ${vpnKey},
      updated_at = NOW()
    WHERE id = ${userId}
  `;
  await sql`
    UPDATE payments SET status = 'succeeded', updated_at = NOW() WHERE id = ${paymentRow.id}
  `;

  const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
  const email = userRows[0]?.email as string | undefined;
  if (email) {
    try {
      await sendVpnKeyEmail(email, vpnKey, tarif.name as string);
    } catch (e) {
      console.error('sendVpnKeyEmail failed:', e); // ключ в профиле, письмо можно продублировать
    }
  }

  return NextResponse.json({ ok: true });
}

// -------------------------------------------------- продление (автосписание)

async function handleRenewal(event: LavaWebhookEvent) {
  let invoice;
  try {
    invoice = await fetchInvoiceStatus(event.contractId);
  } catch (e) {
    console.error('lava fetchInvoiceStatus (renewal) failed:', e);
    return NextResponse.json({ error: 'status check failed' }, { status: 502 });
  }
  if (invoice.status !== 'COMPLETED') {
    return NextResponse.json({ ok: true });
  }

  const parentId = event.parentContractId;
  if (!parentId) {
    console.error(`lava renewal без parentContractId: ${event.contractId}`);
    return NextResponse.json({ ok: true });
  }

  const renewedUserId = await sql.begin(async (tx) => {
    // идемпотентность: продление уже записывали?
    const dup = await tx`
      SELECT id FROM payments WHERE provider_payment_id = ${event.contractId}
    `;
    if (dup[0]) return null;

    // пользователь и тариф — из родительского (первого) платежа подписки
    const parentRows = await tx`
      SELECT user_id, tarif_id FROM payments WHERE provider_payment_id = ${parentId}
    `;
    const parent = parentRows[0];
    if (!parent) {
      console.error(`lava renewal: родитель ${parentId} не найден`);
      return null;
    }

    const tarifRows = await tx`
      SELECT price_rub, duration_days FROM tarifs WHERE id = ${parent.tarif_id}
    `;
    const tarif = tarifRows[0];

    await tx`
      INSERT INTO payments (user_id, tarif_id, amount, provider, provider_payment_id, status)
      VALUES (${parent.user_id}, ${parent.tarif_id}, ${tarif.price_rub},
              'lava', ${event.contractId}, 'succeeded')
    `;
    // Продлеваем от большей из дат: раннее списание не съедает оплаченные
    // дни, позднее — начинается от сегодня. Ключ НЕ трогаем.
    await tx`
      UPDATE users SET
        status = 'active',
        subscription_expires_at =
          GREATEST(COALESCE(subscription_expires_at, NOW()), NOW())
          + (${tarif.duration_days} || ' days')::interval,
        updated_at = NOW()
      WHERE id = ${parent.user_id}
    `;
    return parent.user_id as number;
  });

  if (renewedUserId) {
    const userRows = await sql`SELECT email FROM users WHERE id = ${renewedUserId}`;
    const email = userRows[0]?.email as string | undefined;
    if (email) {
      try {
        await sendRenewalEmail(email);
      } catch (e) {
        console.error('sendRenewalEmail failed:', e);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// -------------------------------------------------- отмена подписки

async function handleCancelled(event: LavaWebhookEvent) {
  // Период оплачен до willExpireAt — доступ живёт до конца срока,
  // ключ погасит cron истечения (появится вместе с реальной выдачей).
  // Сейчас достаточно факта в логе: users.subscription_expires_at уже
  // выставлен последним платежом и сам станет прошлым.
  console.log(
    `lava: подписка отменена (${event.buyer?.email ?? 'email неизвестен'}), доступ до ${event.willExpireAt ?? '—'}`
  );
  return NextResponse.json({ ok: true });
}
