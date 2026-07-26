import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Считаем и выводим ТОЛЬКО те ключи, у которых реально есть текст конфига
  const clientRows = await sql<{ config_text: string }[]>`
    SELECT config_text 
    FROM vpn_clients 
    WHERE user_id = ${user.id} AND config_text IS NOT NULL
  `;

  const vpnKeys = clientRows
    .map(row => row.config_text)
    .filter(Boolean);

  const userWithKeys = {
    ...user,
    vpn_keys: vpnKeys
  };

  return NextResponse.json({ user: userWithKeys });
}