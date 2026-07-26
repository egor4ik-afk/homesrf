import { NextResponse } from 'next/server';
import { issueVpnKey } from '@/lib/vpn';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST() {
  try {
    // 1. Получаем юзера из сессии
    const user = await getCurrentUser();

    if (!user || user.status !== 'active' || !user.tarif_id) {
      return NextResponse.json(
        { error: 'Не авторизован или нет активной подписки' },
        { status: 401 }
      );
    }

    // 2. Проверяем текущее количество активных ключей (пиров) в БД
    const activeClients = await sql<{ count: number }[]>`
      SELECT COUNT(*) as count FROM vpn_clients 
      WHERE user_id = ${user.id} AND revoked_at IS NULL
    `;

    if (activeClients[0].count >= 3) {
      return NextResponse.json(
        { error: 'Достигнут лимит в 3 устройства' },
        { status: 403 }
      );
    }

    // 3. Генерируем новый ключ на сервере (запись в vpn_clients и SSH awg set внутри)
    const newConfig = await issueVpnKey(user.id, user.tarif_id);

    return NextResponse.json({ config: newConfig });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка сервера';
    console.error('Ошибка генерации ключа:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}