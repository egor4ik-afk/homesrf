import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

function pageUrl(locale: string) {
  const path = locale === 'ru' ? '' : `/${locale}`;
  return `https://relaxnet.pro${path}/vpn-dlya-zvonkov`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const url = pageUrl(locale);
  return {
    title: t('vpn_title'),
    description: t('vpn_desc'),
    alternates: { canonical: url },
    openGraph: { title: t('vpn_title'), description: t('vpn_desc'), url, type: 'article' },
    twitter: { title: t('vpn_title'), description: t('vpn_desc') },
  };
}

export default async function VpnForCallsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vpn' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const meta = await getTranslations({ locale, namespace: 'meta' });
  const url = pageUrl(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: nav('home'), item: 'https://relaxnet.pro' },
          { '@type': 'ListItem', position: 2, name: t('breadcrumb_current'), item: url },
        ],
      },
      {
        '@type': 'Product',
        name: 'RelaxNet PRO',
        description: meta('vpn_desc'),
        brand: { '@type': 'Brand', name: 'RelaxNet' },
        offers: {
          '@type': 'Offer',
          price: '199',
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          url,
        },
      },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label={nav('navigation_aria')} className="text-sm text-white/40 mb-10">
        <Link href="/" className="hover:text-white/70">
          {nav('home')}
        </Link>
        <span className="mx-2 text-white/20">/</span>
        <span className="text-white/60">{t('breadcrumb_current')}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-medium leading-tight mb-6">{t('h1')}</h1>

      <p className="text-white/70 text-lg leading-relaxed mb-12">{t('intro')}</p>

      <section
        aria-labelledby="try-title"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-16"
      >
        <h2 id="try-title" className="text-2xl font-medium mb-3">
          {t('try_title')}
        </h2>
        <p className="text-white/70 leading-relaxed mb-7">{t('try_desc')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login?next=trial"
            className="px-6 py-3 rounded-lg bg-accent text-bg font-medium text-center transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('cta_try')}
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-border text-white/80 font-medium text-center transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            {t('cta_pay')}
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">{t('why_title')}</h2>
        <p className="text-white/70 leading-relaxed">{t('why_body')}</p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">{t('how_title')}</h2>
        <p className="text-white/70 leading-relaxed mb-4">{t('how_body1')}</p>
        <p className="text-white/70 leading-relaxed">{t('how_body2')}</p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">{t('features_title')}</h2>
        <ul className="space-y-3 text-white/70">
          {(['feature1', 'feature2', 'feature3', 'feature4', 'feature5'] as const).map((key) => (
            <li key={key} className="flex gap-3">
              <span aria-hidden className="text-accent">—</span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">{t('ip_title')}</h2>
        <p className="text-white/70 leading-relaxed mb-4">{t('ip_body1')}</p>
        <p className="text-white/70 leading-relaxed">{t('ip_body2')}</p>
      </section>

      <footer className="mt-20 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-white/40">
        <Link href="/" className="hover:text-white/70">{t('footer_home')}</Link>
        <Link href="/privacy" className="hover:text-white/70">{t('footer_privacy')}</Link>
        <Link href="/terms" className="hover:text-white/70">{t('footer_terms')}</Link>
      </footer>
    </main>
  );
}