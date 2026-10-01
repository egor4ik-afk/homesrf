// app/[locale]/admin/page.tsx
// Проверка прав — на сервере, до рендера. Неадмин получает 404, а не
// редирект: так страница не подтверждает своё существование посторонним.

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAdmin } from '@/lib/admin';
import AdminClient from '@/components/AdminClient';

export const metadata: Metadata = {
  title: 'Админка — RelaxNet',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const admin = await getAdmin();
  if (!admin) notFound();

  return <AdminClient adminEmail={admin.email} />;
}
