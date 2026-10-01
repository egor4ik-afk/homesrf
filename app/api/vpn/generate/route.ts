// app/api/vpn/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { issueVpnKey } from '@/lib/vpn';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.status !== 'active' || !user.tarif_id) {
      return NextResponse.json(
        { error: 'Не авторизован или нет активной подписки' },
        { status: 401 },
      );
    }

    // Лимит считаем ТОЛЬКО по активным ключам. revoked_at IS NULL
    // обязателен: без него удалённые ключи продолжают занимать место
    // и после удаления новый уже не выпустить.
    const activeClients = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM vpn_clients
      WHERE user_id = ${user.id}
        AND config_text IS NOT NULL
        AND revoked_at IS NULL
    `;

    if (activeClients[0].count >= 3) {
      return NextResponse.json(
        { error: 'Достигнут лимит в 3 устройства' },
        { status: 403 },
      );
    }

    // serverId необязателен. Чужую приватную ноду так не получить:
    // фильтр в issueVpnKey вернёт пусто и поднимет «Нет живого VPN-сервера».
    const body = await req.json().catch(() => ({}));
    const serverId =
      Number.isInteger(body?.serverId) && body.serverId > 0 ? Number(body.serverId) : undefined;

    const { id, configText } = await issueVpnKey(user.id, user.tarif_id, serverId);

    return NextResponse.json({ id, config: configText });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ошибка сервера';
    console.error('Ошибка генерации ключа:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}