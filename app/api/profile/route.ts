import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Достаем ВСЕ валидные конфиги для юзера, сортируем по дате создания
  const clientRows = await sql<{ id: number; config_text: string }[]>`
    SELECT id, config_text 
    FROM vpn_clients 
    WHERE user_id = ${user.id} AND config_text IS NOT NULL AND revoked_at IS NULL
    ORDER BY created_at ASC
  `;

  const vpnKeys: { id: number | null; config: string }[] = clientRows
    .filter(r => r.config_text)
    .map(r => ({ id: r.id, config: r.config_text }));

  // Страховка для самого первого ключа, если его еще нет в vpn_clients с текстом
  if (vpnKeys.length === 0 && user.vpn_key) {
    vpnKeys.push({ id: null, config: user.vpn_key });
  }

  const userWithKeys = {
    ...user,
    vpn_keys: vpnKeys
  };

  return NextResponse.json({ user: userWithKeys });
}