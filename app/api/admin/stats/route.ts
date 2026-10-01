// app/api/admin/stats/route.ts — сводка для дашборда админки.

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const [byStatus, keys, revenue, servers, recent] = await Promise.all([
      sql<{ status: string; count: number }[]>`
        SELECT status, COUNT(*)::int AS count FROM users GROUP BY status ORDER BY count DESC
      `,
      sql<{ live: number; revoked: number }[]>`
        SELECT
          COUNT(*) FILTER (WHERE revoked_at IS NULL)::int     AS live,
          COUNT(*) FILTER (WHERE revoked_at IS NOT NULL)::int AS revoked
        FROM vpn_clients
      `,
      sql<{ month: string; total: number; count: number }[]>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
               COALESCE(SUM(amount), 0)::float AS total,
               COUNT(*)::int AS count
        FROM payments
        WHERE status = 'succeeded' AND created_at > NOW() - INTERVAL '6 months'
        GROUP BY 1 ORDER BY 1 DESC
      `,
      sql<{ id: number; name: string; ip: string; is_healthy: boolean; visibility: string; clients: number }[]>`
        SELECT vs.id, vs.name, vs.ip, vs.is_healthy, vs.visibility,
               COUNT(vc.id) FILTER (WHERE vc.revoked_at IS NULL)::int AS clients
        FROM vpn_servers vs
        LEFT JOIN vpn_clients vc ON vc.vpn_server_id = vs.id
        GROUP BY vs.id ORDER BY vs.id
      `,
      sql<{ email: string; amount: number; status: string; created_at: string }[]>`
        SELECT u.email, p.amount::float, p.status, p.created_at
        FROM payments p JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC LIMIT 10
      `,
    ]);

    return NextResponse.json({
      byStatus,
      keys: keys[0] ?? { live: 0, revoked: 0 },
      revenue,
      servers,
      recentPayments: recent,
    });
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}
