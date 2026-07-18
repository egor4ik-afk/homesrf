import { cookies } from 'next/headers';
import sql from './db';
import { SESSION_COOKIE } from './constants';

export interface CurrentUser {
  id: number;
  email: string;
  status: string;
  subscription_expires_at: string | null;
  vpn_key: string | null;
  tarif_id: number | null;
  tarif_name: string | null;
}

/** Читает cookie сессии и достаёт пользователя из БД. null — если не авторизован/сессия истекла. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql<CurrentUser[]>`
    SELECT
      u.id, u.email, u.status, u.subscription_expires_at, u.vpn_key,
      t.id AS tarif_id, t.name AS tarif_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN tarifs t ON t.id = u.tarif_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `;

  return rows[0] ?? null;
}
