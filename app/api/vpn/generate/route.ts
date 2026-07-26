import { NextResponse } from 'next/server';
import { issueVpnKey } from '@/lib/vpn';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.status !== 'active' || !user.tarif_id) {
      return NextResponse.json(
        { error: 'Не авторизован или нет активной подписки' },
        { status: 401 }
      );
    }

    // Проверяем лимит по количеству реально выданных конфигов
    const activeClients = await sql<{ count: number }[]>`
      SELECT COUNT(*) as count FROM vpn_clients 
      WHERE user_id = ${user.id} AND config_text IS NOT NULL
    `;

    if (activeClients[0].count >= 3) {
      return NextResponse.json(
        { error: 'Достигнут лимит в 3 устройства' },
        { status: 403 }
      );
    }

    const newConfig = await issueVpnKey(user.id, user.tarif_id);

    return NextResponse.json({ config: newConfig });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка сервера';
    console.error('Ошибка генерации ключа:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}