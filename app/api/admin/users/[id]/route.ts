// app/api/admin/users/[id]/route.ts
// ─────────────────────────────────────────────────────────────────────────
// Действия админа над пользователем:
//   extend   — продлить подписку на N дней (и вернуть в active)
//   status   — выставить статус вручную
//   revoke   — снять все ключи (пиры с нод + revoked_at)
//   admin    — выдать/забрать права админа
//
// Почему extend не трогает ключи: продление по смыслу не меняет доступ,
// пиры на нодах остаются живыми. А вот возврат из 'expired' в 'active'
// ключи НЕ воскрешает — cron их уже снял с ноды. Об этом сообщаем в
// ответе, чтобы админ не думал, что доступ восстановился сам.
// ─────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin, adminErrorResponse, audit } from '@/lib/admin';
import { revokeUserKeys } from '@/lib/vpn';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['active', 'inactive', 'trial', 'expired'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    const exists = await sql<{ id: number; email: string }[]>`
      SELECT id, email FROM users WHERE id = ${userId}
    `;
    if (!exists[0]) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    switch (action) {
      case 'extend': {
        const days = Number(body.days);
        if (!Number.isFinite(days) || days === 0 || Math.abs(days) > 3650) {
          return NextResponse.json({ error: 'days: число от -3650 до 3650' }, { status: 400 });
        }
        // GREATEST, чтобы продление не укорачивало уже оплаченный срок.
        const updated = await sql<{ subscription_expires_at: string }[]>`
          UPDATE users SET
            subscription_expires_at =
              GREATEST(COALESCE(subscription_expires_at, NOW()), NOW())
              + (${days} || ' days')::interval,
            status = CASE WHEN ${days} > 0 THEN 'active' ELSE status END,
            updated_at = NOW()
          WHERE id = ${userId}
          RETURNING subscription_expires_at
        `;
        await audit(admin.id, 'extend', 'user', userId, { days });
        return NextResponse.json({
          ok: true,
          subscription_expires_at: updated[0].subscription_expires_at,
          note: 'Срок сдвинут. Если ключи были отозваны ранее, их нужно выпустить заново.',
        });
      }

      case 'status': {
        const next = String(body.status ?? '');
        if (!ALLOWED_STATUSES.includes(next as (typeof ALLOWED_STATUSES)[number])) {
          return NextResponse.json(
            { error: `status: один из ${ALLOWED_STATUSES.join(', ')}` },
            { status: 400 },
          );
        }
        await sql`UPDATE users SET status = ${next}, updated_at = NOW() WHERE id = ${userId}`;
        await audit(admin.id, 'status', 'user', userId, { status: next });
        return NextResponse.json({ ok: true });
      }

      case 'revoke': {
        // Долгая операция: SSH к каждой ноде. Таймаут ssh — 20 с на ключ.
        await revokeUserKeys(userId);
        await audit(admin.id, 'revoke', 'user', userId);
        return NextResponse.json({ ok: true });
      }

      case 'admin': {
        const value = Boolean(body.value);
        if (userId === admin.id && !value) {
          return NextResponse.json(
            { error: 'Нельзя снять права с самого себя' },
            { status: 400 },
          );
        }
        await sql`UPDATE users SET is_admin = ${value} WHERE id = ${userId}`;
        await audit(admin.id, 'admin', 'user', userId, { value });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: 'action: extend | status | revoke | admin' },
          { status: 400 },
        );
    }
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}

/** Детали одного пользователя: ключи с нодами и история платежей. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
    }

    const [keys, payments] = await Promise.all([
      sql`
        SELECT vc.id, vc.allowed_ip, vc.created_at, vc.revoked_at,
               vs.name AS server_name, vs.assign_country
        FROM vpn_clients vc
        JOIN vpn_servers vs ON vs.id = vc.vpn_server_id
        WHERE vc.user_id = ${userId}
        ORDER BY vc.created_at DESC
      `,
      sql`
        SELECT id, amount::float, status, provider, created_at
        FROM payments WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 20
      `,
    ]);

    return NextResponse.json({ keys, payments });
  } catch (e) {
    const { error, status } = adminErrorResponse(e);
    return NextResponse.json({ error }, { status });
  }
}
