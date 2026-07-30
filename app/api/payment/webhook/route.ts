import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchInvoiceStatus, isCompleted, verifyWebhookAuth, type LavaWebhookEvent } from '@/lib/lava';
import { sendVpnKeyEmail, sendRenewalEmail } from '@/lib/mailer';
import { issueVpnKey } from '@/lib/vpn';
import { revokeTrialBeforeUpgrade } from '@/lib/trial';

/**
 * Вебхук lava.top. В кабинете ДВА вебхука на этот URL:
 *   «Результат платежа»  → payment.success / payment.failed
 *   «Регулярный платёж»  → subscription.recurring.payment.*
 * Аутентификация обоих — Basic (LAVA_WEBHOOK_LOGIN / LAVA_WEBHOOK_PASSWORD).
 *
 * Отличия от старой ЮKassa-версии:
 *  - SELECT ... FOR UPDATE — параллельные вебхуки не обрабатываются оба;
 *  - payments.status = succeeded ставится ПОСЛЕ выдачи ключа: упала выдача →
 *    502 → lava ретраит → повторная попытка (раньше ключ терялся навсегда);
 *  - продления по parentContractId, ключ не перевыпускается;
 *  - отмена подписки не отзывает ключ: период оплачен до willExpireAt.
 */
export async function POST(req: NextRequest) {
  if (!verifyWebhookAuth(req.headers.get('authorization'))) {
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
      // lava ретраит списание сама (+8ч, +24ч), после третьей неудачи
      // придёт subscription.cancelled — здесь делать нечего
      return NextResponse.json({ ok: true });
    case 'subscription.cancelled':
      console.log(
        `lava: подписка отменена (${event.buyer?.email ?? '—'}), доступ до ${event.willExpireAt ?? '—'}`
      );
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: true });
  }
}

// ---------------------------------------------- первый / разовый платёж

async function handleFirstPayment(event: LavaWebhookEvent) {
  // Телу не доверяем — перепроверяем статус в самой lava
  let invoice;
  try {
    invoice = await fetchInvoiceStatus(event.contractId);
  } catch (e) {
    console.error('lava fetchInvoiceStatus failed:', e);
    return NextResponse.json({ error: 'status check failed' }, { status: 502 });
  }
  if (!isCompleted(invoice)) {
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
    // Инвойс создавали мы — строка обязана быть. Нет строки = оплата мимо
    // payment/create (например, напрямую со страницы lava): лог для ручного
    // матчинга, автоматика в MVP не разбирает.
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

  // Сумму назначает оффер lava — расхождение с тарифом значит, что кабинет
  // и БД разъехались. Не блокируем, но кричим в лог.
  const paidAmount = invoice.amountTotal?.amount ?? invoice.receipt?.amount;
  if (paidAmount != null && Number(paidAmount) !== Number(tarif.price_rub)) {
    console.error(
      `lava: сумма инвойса ${paidAmount} != tarifs.price_rub ${tarif.price_rub} (contractId=${event.contractId})`
    );
  }

  // Был триал — снимаем его ключ перед выдачей PRO, чтобы не занимал слот.
  try {
    await revokeTrialBeforeUpgrade(userId);
  } catch (e) {
    console.error('revokeTrialBeforeUpgrade failed:', e); // оплату не блокируем
  }

  // Выдача ключа ДО пометки succeeded (см. шапку файла)
  let vpnKey: string;
  try {
    const issued = await issueVpnKey(userId, tarif.id as number);
    vpnKey = issued.configText;
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
      console.error('sendVpnKeyEmail failed:', e); // ключ в профиле, письмо продублируем вручную
    }
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------- продление (автосписание)

async function handleRenewal(event: LavaWebhookEvent) {
  let invoice;
  try {
    invoice = await fetchInvoiceStatus(event.contractId);
  } catch (e) {
    console.error('lava fetchInvoiceStatus (renewal) failed:', e);
    return NextResponse.json({ error: 'status check failed' }, { status: 502 });
  }
  if (!isCompleted(invoice)) {
    return NextResponse.json({ ok: true });
  }

  const parentId = event.parentContractId;
  if (!parentId) {
    console.error(`lava renewal без parentContractId: ${event.contractId}`);
    return NextResponse.json({ ok: true });
  }

  const renewedUserId = await sql.begin(async (tx) => {
    const dup = await tx`
      SELECT id FROM payments WHERE provider_payment_id = ${event.contractId}
    `;
    if (dup[0]) return null; // повторный вебхук

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
    // Раннее списание не съедает оплаченные дни, позднее — от сегодня.
    // Ключ НЕ трогаем.
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