import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createInvoice } from '@/lib/lava';

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
    SELECT id, name, price_rub, lava_offer_id
    FROM tarifs WHERE id = ${tarifId} AND status = 'active'
  `;
  const tarif = tarifRows[0];
  if (!tarif) {
    return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 });
  }
  if (!tarif.lava_offer_id) {
    console.error(`Тариф ${tarif.id} не привязан к офферу lava (tarifs.lava_offer_id)`);
    return NextResponse.json({ error: 'Оплата временно недоступна' }, { status: 502 });
  }

  let invoice;
  try {
    // email из нашей сессии — по нему же вебхук приматчится обратно
    invoice = await createInvoice(user.email as string, tarif.lava_offer_id as string);
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
