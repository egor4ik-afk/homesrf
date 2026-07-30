import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/seo';

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('terms_title'),
    description: t('terms_desc'),
    alternates: buildAlternates(locale, '/terms'),
  };
}

export default function TermsPage() {
  const t = useTranslations('terms');
  const nav = useTranslations('nav');

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-white/40 text-sm hover:text-white/70">
        {nav('back_home')}
      </Link>

      <h1 className="text-2xl font-medium mt-6 mb-2">{t('h1')}</h1>
      <p className="text-white/40 text-sm mb-8">{t('draft_note')}</p>

      <div className="space-y-6 text-white/70 leading-relaxed">
        <section>
          <h2 className="text-white font-medium mb-2">{t('s1_title')}</h2>
          <p>{t('s1_body')}</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">{t('s2_title')}</h2>
          <p>{t('s2_body')}</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">{t('s3_title')}</h2>
          <p>{t('s3_body')}</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">{t('s4_title')}</h2>
          <p>
            Telegram:{' '}
            <a href="https://t.me/sup_re" className="text-white hover:underline">
              @sup_re
            </a>
            <br />
            Email:{' '}
            <a href="mailto:support@webbuild.ge" className="text-white hover:underline">
              support@webbuild.ge
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
