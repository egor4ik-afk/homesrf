// app/api/admin/users/route.ts — список пользователей с поиском.

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();
    const status = searchParams.get('status') ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const offset = (page - 1) * PAGE_SIZE;

    // Фильтры подставляем через параметры — конкатенация SQL здесь
    // недопустима даже для админки: q приходит из строки браузера.
    const rows = await sql<
      {
        id: number;
        email: string;
        status: string;
        is_admin: boolean;
        subscription_expires_at: string | null;
        trial_expires_at: string | null;
        tarif_name: string | null;
        live_keys: number;
        created_at: string;
      }[]
    >`
      SELECT
        u.id, u.email, u.status, u.is_admin,
        u.subscription_expires_at, u.trial_expires_at, u.created_at,
        t.name AS tarif_name,
        COUNT(vc.id) FILTER (WHERE vc.revoked_at IS NULL)::int AS live_keys
      FROM users u
      LEFT JOIN tarifs t ON t.id = u.tarif_id
      LEFT JOIN vpn_clients vc ON vc.user_id = u.id
      WHERE (${q} = '' OR lower(u.email) LIKE ${'%' + q + '%'})
        AND (${status} = '' OR u.status = ${status})
      GROUP BY u.id, t.name
      ORDER BY u.id DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;

    const totalRows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM users u
      WHERE (${q} = '' OR lower(u.email) LIKE ${'%' + q + '%'})
        AND (${status} = '' OR u.status = ${status})
    `;

    return NextResponse.json({
      users: rows,
      total: totalRows[0]?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}
