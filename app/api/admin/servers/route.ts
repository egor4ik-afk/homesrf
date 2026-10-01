// app/api/admin/servers/route.ts — список нод и добавление новой.

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin, adminErrorResponse, audit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const servers = await sql`
      SELECT
        vs.id, vs.name, vs.ip, vs.ssh_host, vs.assign_country,
        vs.is_healthy, vs.visibility, vs.owner_user_id,
        ou.email AS owner_email,
        COUNT(vc.id) FILTER (WHERE vc.revoked_at IS NULL)::int AS live_keys,
        (vss.vpn_server_id IS NOT NULL) AS has_settings,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL) AS tarifs
      FROM vpn_servers vs
      LEFT JOIN users ou ON ou.id = vs.owner_user_id
      LEFT JOIN vpn_clients vc ON vc.vpn_server_id = vs.id
      LEFT JOIN vpn_server_settings vss ON vss.vpn_server_id = vs.id
      LEFT JOIN tarif_vpn_servers tvs ON tvs.vpn_server_id = vs.id
      LEFT JOIN tarifs t ON t.id = tvs.tarif_id
      GROUP BY vs.id, ou.email, vss.vpn_server_id
      ORDER BY vs.id
    `;

    return NextResponse.json({ servers });
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    const ip = String(body.ip ?? '').trim();
    const sshHost = String(body.ssh_host ?? ip).trim();
    const country = String(body.assign_country ?? '').trim() || null;
    const visibility = body.visibility === 'private' ? 'private' : 'public';

    if (!name || !ip) {
      return NextResponse.json({ error: 'name и ip обязательны' }, { status: 400 });
    }

    // Приватная нода без владельца невидима вообще никому — вешаем на
    // того админа, который её создал.
    const ownerId = visibility === 'private' ? admin.id : null;

    const inserted = await sql<{ id: number }[]>`
      INSERT INTO vpn_servers (name, ip, ssh_host, assign_country, is_healthy, visibility, owner_user_id)
      VALUES (${name}, ${ip}, ${sshHost}, ${country}, FALSE, ${visibility}, ${ownerId})
      RETURNING id
    `;

    await audit(admin.id, 'server_create', 'server', inserted[0].id, { name, ip, visibility });

    return NextResponse.json({
      ok: true,
      id: inserted[0].id,
      note: 'Нода создана выключенной (is_healthy = false). Заполните vpn_server_settings по VPN-SETUP.md, привяжите к тарифу и только потом включайте.',
    });
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}
