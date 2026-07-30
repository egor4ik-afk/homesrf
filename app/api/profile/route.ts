import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Достаем ВСЕ валидные конфиги для юзера, и свежий trial_expires_at
  const [clientRows, userRows] = await Promise.all([
    sql<
      { id: number; config_text: string; assign_country: string | null }[]
    >`
      SELECT vc.id, vc.config_text, vs.assign_country
      FROM vpn_clients vc
      JOIN vpn_servers vs ON vs.id = vc.vpn_server_id
      WHERE vc.user_id = ${user.id}
        AND vc.config_text IS NOT NULL
        AND vc.revoked_at IS NULL
      ORDER BY vc.created_at ASC
    `,
    sql<{ trial_expires_at: Date | null }[]>`
      SELECT trial_expires_at FROM users WHERE id = ${user.id}
    `,
  ]);

  const vpnKeys: { id: number | null; config: string; country: string | null }[] =
    clientRows
      .filter((r) => r.config_text)
      .map((r) => ({ id: r.id, config: r.config_text, country: r.assign_country }));

  // Страховка для самого первого ключа, если его еще нет в vpn_clients с текстом
  if (vpnKeys.length === 0 && user.vpn_key) {
    vpnKeys.push({ id: null, config: user.vpn_key, country: null });
  }

  const trialExpiresAt = userRows[0]?.trial_expires_at;

  const userWithKeys = {
    ...user,
    vpn_keys: vpnKeys,
    trial_expires_at: trialExpiresAt ? new Date(trialExpiresAt).toISOString() : null,
  };

  return NextResponse.json({ user: userWithKeys });
}
