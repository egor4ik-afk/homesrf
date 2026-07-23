import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchPaymentStatus } from '@/lib/yookassa';
import { sendVpnKeyEmail } from '@/lib/mailer';
import { issueVpnKey } from '@/lib/vpn';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const paymentId = body?.object?.id as string | undefined;

  if (!paymentId) {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }

  // Телу вебхука не доверяем — перезапрашиваем статус в самой ЮKassa
  let payment;
  try {
    payment = await fetchPaymentStatus(paymentId);
  } catch (e) {
    console.error('fetchPaymentStatus failed:', e);
    return NextResponse.json({ error: 'status check failed' }, { status: 502 });
  }

  if (payment.status !== 'succeeded') {
    // подтверждаем приём, но не обрабатываем — просто не наш случай
    return NextResponse.json({ ok: true });
  }

  const rows = await sql`
    SELECT id, user_id, tarif_id, status FROM payments WHERE provider_payment_id = ${paymentId}
  `;
  const paymentRow = rows[0];
  if (!paymentRow) {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 });
  }
  if (paymentRow.status === 'succeeded') {
    return NextResponse.json({ ok: true }); // уже обработано — идемпотентность
  }

  await sql`UPDATE payments SET status = 'succeeded', updated_at = NOW() WHERE id = ${paymentRow.id}`;

  const tarifRows = await sql`
    SELECT id, name, duration_days FROM tarifs WHERE id = ${paymentRow.tarif_id}
  `;
  const tarif = tarifRows[0];
  const userId = paymentRow.user_id as number;

  const vpnKey = await issueVpnKey(userId, tarif.id as number);

  // Сохраняем карту, только если ЮKassa реально её сохранила (пользователь
  // согласился на странице оплаты) — иначе payment_method.saved будет false,
  // и мы просто не трогаем то, что уже было в профиле (COALESCE ниже).
  const savedCard =
    payment.payment_method?.type === 'bank_card' && payment.payment_method.saved
      ? {
          paymentMethodId: payment.payment_method.id,
          last4: payment.payment_method.card?.last4 ?? null,
          cardType: payment.payment_method.card?.card_type ?? null,
        }
      : null;

  await sql`
    UPDATE users SET
      tarif_id = ${tarif.id},
      status = 'active',
      subscription_expires_at = NOW() + (${tarif.duration_days} || ' days')::interval,
      vpn_key = ${vpnKey},
      payment_method_id = COALESCE(${savedCard?.paymentMethodId ?? null}, payment_method_id),
      card_last4 = COALESCE(${savedCard?.last4 ?? null}, card_last4),
      card_type = COALESCE(${savedCard?.cardType ?? null}, card_type),
      updated_at = NOW()
    WHERE id = ${userId}
  `;

  const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
  const email = userRows[0]?.email as string | undefined;

  if (email) {
    try {
      await sendVpnKeyEmail(email, vpnKey, tarif.name as string);
    } catch (e) {
      // ключ уже выдан и сохранён в профиле — письмо можно будет продублировать вручную
      console.error('sendVpnKeyEmail failed:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
