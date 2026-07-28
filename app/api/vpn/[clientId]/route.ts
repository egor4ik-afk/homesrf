// app/api/vpn/[clientId]/route.ts
//
// Удаление одного ключа. Порядок критичен: сначала снимаем пир с ноды
// по public_key, потом помечаем revoked_at. Если сделать наоборот и БД
// обновится первой, а SSH упадёт — ключ на сервере останется навсегда,
// потому что снять пир можно только по ключу, а он уже «отвязан».
//
// revoked_at вместо DELETE: строка и выданный IP остаются в истории,
// allocateIp видит адрес свободным, а связь ключ↔нода не теряется.

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { removePeerOnNode } from '@/lib/vpn';
import sql from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { clientId } = await params;
  const id = Number(clientId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }

  // Берём только СВОЙ и ещё не отозванный ключ — чужой удалить нельзя
  const rows = await sql<{ id: number; public_key: string; ssh_host: string | null }[]>`
    SELECT vc.id, vc.public_key, vs.ssh_host
    FROM vpn_clients vc
    JOIN vpn_servers vs ON vs.id = vc.vpn_server_id
    WHERE vc.id = ${id} AND vc.user_id = ${user.id} AND vc.revoked_at IS NULL
    LIMIT 1
  `;
  const client = rows[0];
  if (!client) {
    return NextResponse.json({ error: 'Ключ не найден' }, { status: 404 });
  }

  // 1. Снимаем пир с сервера
  if (client.ssh_host) {
    try {
      await removePeerOnNode(client.ssh_host, client.public_key);
    } catch (e) {
      console.error(`Не удалось снять пир ${client.public_key} с ноды:`, e);
      // БД не трогаем — иначе получим осиротевший пир
      return NextResponse.json(
        { error: 'Не удалось удалить ключ на сервере, попробуйте позже' },
        { status: 502 },
      );
    }
  }

  // 2. Только теперь помечаем в БД
  await sql`UPDATE vpn_clients SET revoked_at = NOW() WHERE id = ${client.id}`;

  return NextResponse.json({ ok: true });
}