import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * У ЮKassa нет API-метода "удалить сохранённый способ оплаты" — карта живёт
 * на их стороне до истечения срока действия, а "отвязка" со стороны магазина
 * означает только одно: мы перестаём использовать payment_method_id для
 * будущих платежей и стираем его у себя. Источник:
 * https://yookassa.ru/developers/payment-acceptance/scenario-extensions/recurring-payments/basics
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`
    UPDATE users SET
      payment_method_id = NULL,
      card_last4 = NULL,
      card_type = NULL,
      updated_at = NOW()
    WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true });
}
