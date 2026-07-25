import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createInvoice } from '@/lib/lava';

/**
 * POST /api/payment/create
 * Тело: { tarifId, payMethod?: 'card' | 'sbp' }
 *  - card (по умолчанию): подписка с автопродлением, tarifs.lava_offer_id
 *  - sbp: разовый месяц без автопродления, tarifs.lava_offer_id_onetime
 *    (СБП несовместим с подпиской — подтверждено поддержкой lava).
 * Кнопку СБП на фронте включать после активации PAY2ME на аккаунте.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tarifId, payMethod } = await req.json().catch(() => ({ tarifId: null, payMethod: null }));
  if (!tarifId) {
    return NextResponse.json({ error: 'tarifId обязателен' }, { status: 400 });
  }
  const isSbp = payMethod === 'sbp';

  const tarifRows = await sql`
    SELECT id, name, price_rub, lava_offer_id, lava_offer_id_onetime
    FROM tarifs WHERE id = ${tarifId} AND status = 'active'
  `;
  const tarif = tarifRows[0];
  if (!tarif) {
    return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 });
  }

  const offerId = isSbp ? tarif.lava_offer_id_onetime : tarif.lava_offer_id;
  if (!offerId) {
    console.error(`Тариф ${tarif.id}: не задан ${isSbp ? 'lava_offer_id_onetime' : 'lava_offer_id'}`);
    return NextResponse.json({ error: 'Оплата временно недоступна' }, { status: 502 });
  }

  let invoice;
  try {
    invoice = await createInvoice(
      user.email as string,
      offerId as string,
      isSbp ? { provider: 'PAY2ME', methodType: 'SBP', oneTime: true } : {}
    );
  } catch (e) {
    console.error('lava createInvoice failed:', e);
    return NextResponse.json({ error: 'Не удалось создать платёж' }, { status: 502 });
  }

  await sql`
    INSERT INTO payments (user_id, tarif_id, amount, provider, provider_payment_id, status)
    VALUES (${user.id}, ${tarif.id}, ${tarif.price_rub}, 'lava', ${invoice.id}, 'pending')
  `;

  return NextResponse.json({ confirmationUrl: invoice.paymentUrl ?? null });
}