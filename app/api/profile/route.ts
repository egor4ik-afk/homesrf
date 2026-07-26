import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Достаем все активные конфиги для этого юзера из vpn_clients
  const clientRows = await sql<{ config_text: string }[]>`
    SELECT config_text 
    FROM vpn_clients 
    WHERE user_id = ${user.id} AND revoked_at IS NULL
  `;

  // Превращаем в массив строк, отфильтровывая возможные null (если есть старые записи)
  const vpnKeys = clientRows
    .map(row => row.config_text)
    .filter(Boolean);

  // Примешиваем массив ключей к объекту юзера
  const userWithKeys = {
    ...user,
    vpn_keys: vpnKeys
  };

  return NextResponse.json({ user: userWithKeys });
}