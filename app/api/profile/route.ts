import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Достаем ВСЕ валидные конфиги для юзера, сортируем по дате создания
  const clientRows = await sql<{ config_text: string }[]>`
    SELECT config_text 
    FROM vpn_clients 
    WHERE user_id = ${user.id} AND config_text IS NOT NULL AND revoked_at IS NULL
    ORDER BY created_at ASC
  `;

  const vpnKeys = clientRows
    .map(row => row.config_text)
    .filter(Boolean);

  // Страховка для самого первого ключа, если его еще нет в vpn_clients с текстом
  if (vpnKeys.length === 0 && user.vpn_key) {
    vpnKeys.push(user.vpn_key);
  }

  const userWithKeys = {
    ...user,
    vpn_keys: vpnKeys
  };

  return NextResponse.json({ user: userWithKeys });
}