import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';
import { DOWNLOADS_URL } from '@/lib/constants';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const tarifs = await sql`
    SELECT id, name, price_rub, duration_days, max_connections
    FROM tarifs
    WHERE status = 'active'
    ORDER BY price_rub DESC
  `;

  // Достаем ВСЕ валидные конфиги из vpn_clients для этого юзера
  const clientRows = await sql<
    { id: number; config_text: string; assign_country: string | null }[]
  >`
    SELECT vc.id, vc.config_text, vs.assign_country
    FROM vpn_clients vc
    JOIN vpn_servers vs ON vs.id = vc.vpn_server_id
    WHERE vc.user_id = ${user.id}
      AND vc.config_text IS NOT NULL
      AND vc.revoked_at IS NULL
    ORDER BY vc.created_at ASC
  `;

  const vpnKeys: { id: number | null; config: string; country: string | null }[] =
    clientRows
      .filter(r => r.config_text)
      .map(r => ({ id: r.id, config: r.config_text, country: r.assign_country }));

  const safeUser = {
    id: user.id,
    email: user.email,
    status: user.status,
    subscription_expires_at: user.subscription_expires_at
      ? new Date(user.subscription_expires_at).toISOString()
      : null,
    vpn_key: user.vpn_key,
    // Вот здесь подмешиваем массив ключей из vpn_clients:
    vpn_keys: vpnKeys.length > 0
      ? vpnKeys
      : (user.vpn_key ? [{ id: null, config: user.vpn_key, country: null }] : []),
    tarif_id: user.tarif_id,
    tarif_name: user.tarif_name,
    card_last4: user.card_last4,
    card_type: user.card_type,
  };

  return (
    <Suspense fallback={null}>
      <ProfileClient
        user={safeUser}
        tarifs={tarifs.map((t) => ({
          id: t.id as number,
          name: t.name as string,
          priceRub: Number(t.price_rub),
          durationDays: t.duration_days as number,
          maxConnections: t.max_connections as number,
        }))}
        downloadsUrl={DOWNLOADS_URL}
      />
    </Suspense>
  );
}