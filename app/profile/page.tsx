import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const tarifs = await sql`
    SELECT id, name, price_rub, duration_days
    FROM tarifs
    WHERE status = 'active'
    ORDER BY price_rub DESC
  `;

  const safeUser = {
    id: user.id,
    email: user.email,
    status: user.status,
    subscription_expires_at: user.subscription_expires_at
      ? new Date(user.subscription_expires_at).toISOString()
      : null,
    vpn_key: user.vpn_key,
    tarif_id: user.tarif_id,
    tarif_name: user.tarif_name,
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
        }))}
        downloadsUrl={process.env.NEXT_PUBLIC_DOWNLOADS_URL || ''}
      />
    </Suspense>
  );
}
