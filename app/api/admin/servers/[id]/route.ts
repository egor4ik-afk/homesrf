// app/api/admin/servers/[id]/route.ts — вкл/выкл ноды и смена видимости.

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin, adminErrorResponse, audit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const serverId = Number(id);
    if (!Number.isInteger(serverId) || serverId <= 0) {
      return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    switch (action) {
      case 'health': {
        const value = Boolean(body.value);

        // Включать ноду без настроек нельзя: issueVpnKey выберет её
        // (ORDER BY RANDOM()) и упадёт на отсутствии endpoint/serverPublicKey,
        // а пользователь увидит «Ошибка сервера» при выдаче ключа.
        if (value) {
          const ready = await sql<{ ok: boolean }[]>`
            SELECT (vss.settings IS NOT NULL
                    AND vss.settings ? 'endpoint'
                    AND vss.settings ? 'serverPublicKey') AS ok
            FROM vpn_servers vs
            LEFT JOIN vpn_server_settings vss ON vss.vpn_server_id = vs.id
            WHERE vs.id = ${serverId}
          `;
          if (!ready[0]?.ok) {
            return NextResponse.json(
              { error: 'Сначала заполните vpn_server_settings (endpoint, serverPublicKey, awg)' },
              { status: 400 },
            );
          }
        }

        await sql`UPDATE vpn_servers SET is_healthy = ${value} WHERE id = ${serverId}`;
        await audit(admin.id, 'server_health', 'server', serverId, { value });
        return NextResponse.json({ ok: true });
      }

      case 'visibility': {
        const visibility = body.visibility === 'private' ? 'private' : 'public';
        const ownerId = visibility === 'private' ? (Number(body.owner_user_id) || admin.id) : null;

        await sql`
          UPDATE vpn_servers
          SET visibility = ${visibility}, owner_user_id = ${ownerId}
          WHERE id = ${serverId}
        `;
        await audit(admin.id, 'server_visibility', 'server', serverId, { visibility, ownerId });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'action: health | visibility' }, { status: 400 });
    }
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}
