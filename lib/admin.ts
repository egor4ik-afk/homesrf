// lib/admin.ts
// ─────────────────────────────────────────────────────────────────────────
// Проверка прав админа. Единственный источник истины — колонка
// users.is_admin, а не список email в коде: иначе смена состава админов
// требует пересборки контейнера, а забытый email в git живёт вечно.
// ─────────────────────────────────────────────────────────────────────────

import sql from './db';
import { getCurrentUser, type CurrentUser } from './auth';

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface AdminUser extends CurrentUser {
  is_admin: true;
}

/**
 * Возвращает текущего пользователя, если он админ, иначе null.
 * getCurrentUser() не тянет is_admin, поэтому добираем отдельным запросом —
 * он уходит в тот же пул и стоит дешевле, чем менять общий тип сессии.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await sql<{ is_admin: boolean }[]>`
    SELECT is_admin FROM users WHERE id = ${user.id}
  `;
  if (!rows[0]?.is_admin) return null;

  return { ...user, is_admin: true };
}

/**
 * Для API-роутов: бросает AdminError, который роут превращает в 401/403.
 * Намеренно разные коды: 401 — «войдите», 403 — «вошли, но не админ».
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new AdminError('Войдите в аккаунт', 401);

  const rows = await sql<{ is_admin: boolean }[]>`
    SELECT is_admin FROM users WHERE id = ${user.id}
  `;
  if (!rows[0]?.is_admin) throw new AdminError('Недостаточно прав', 403);

  return { ...user, is_admin: true };
}

/** Пишет действие в admin_audit. Падение журнала не должно рушить операцию. */
export async function audit(
  adminId: number,
  action: string,
  targetType?: string,
  targetId?: number,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_audit (admin_id, action, target_type, target_id, details)
      VALUES (${adminId}, ${action}, ${targetType ?? null}, ${targetId ?? null},
              ${details ? JSON.stringify(details) : null}::jsonb)
    `;
  } catch (e) {
    console.error('admin_audit write failed:', e);
  }
}

/** Единый обработчик ошибок для админских роутов. */
export function adminErrorResponse(e: unknown): { error: string; status: number } {
  if (e instanceof AdminError) return { error: e.message, status: e.status };
  console.error('admin route failed:', e);
  return { error: 'Ошибка сервера', status: 500 };
}
