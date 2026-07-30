import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LoginForm from './LoginForm';
import { buildAlternates } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('login_title'),
    description: t('login_desc'),
    alternates: buildAlternates(locale, '/login'),
    robots: { index: false, follow: true },
  };
}

export default function LoginPage() {
  return <LoginForm />;
}