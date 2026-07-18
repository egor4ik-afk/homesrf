import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createPayment } from '@/lib/yookassa';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tarifId } = await req.json().catch(() => ({ tarifId: null }));
  if (!tarifId) {
    return NextResponse.json({ error: 'tarifId обязателен' }, { status: 400 });
  }

  const tarifRows = await sql`
    SELECT id, name, price_rub FROM tarifs WHERE id = ${tarifId} AND status = 'active'
  `;
  const tarif = tarifRows[0];
  if (!tarif) {
    return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 });
  }

  let payment;
  try {
    payment = await createPayment(
      Number(tarif.price_rub),
      `RelaxNet — тариф ${tarif.name}`,
      { user_id: user.id, tarif_id: tarif.id }
    );
  } catch (e) {
    console.error('createPayment failed:', e);
    return NextResponse.json({ error: 'Не удалось создать платёж' }, { status: 502 });
  }

  await sql`
    INSERT INTO payments (user_id, tarif_id, amount, provider, provider_payment_id, status)
    VALUES (${user.id}, ${tarif.id}, ${tarif.price_rub}, 'yookassa', ${payment.id}, ${payment.status})
  `;

  return NextResponse.json({ confirmationUrl: payment.confirmation?.confirmation_url ?? null });
}
