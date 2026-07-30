import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const URL = 'https://relaxnet.pro/vpn-dlya-zvonkov';

export const metadata: Metadata = {
  title: 'VPN для звонков в Telegram и доступа к ChatGPT',
  description:
    'Звонки в Telegram и WhatsApp без обрывов, скорость 100–200 Мбит/с, доступ к ChatGPT, Gemini, Claude и Google AI Studio. Час на проверку до оплаты, оплата в рублях.',
  alternates: { canonical: URL, languages: { 'ru-RU': URL } },
  openGraph: {
    title: 'VPN для звонков в Telegram и доступа к ChatGPT',
    description:
      'Звонки без обрывов, 100–200 Мбит/с, стабильный доступ к нейросетям. Сначала проверьте час бесплатно — потом платите.',
    url: URL,
    type: 'article',
  },
  twitter: {
    title: 'VPN для звонков в Telegram и доступа к ChatGPT',
    description:
      'Звонки без обрывов, 100–200 Мбит/с, доступ к ChatGPT, Gemini, Claude. Час на проверку бесплатно.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://relaxnet.pro' },
        { '@type': 'ListItem', position: 2, name: 'VPN для звонков и нейросетей', item: URL },
      ],
    },
    {
      '@type': 'Product',
      name: 'RelaxNet PRO',
      description:
        'VPN для звонков в мессенджерах и стабильного доступа к нейросетям. До 3 устройств на аккаунт.',
      brand: { '@type': 'Brand', name: 'RelaxNet' },
      offers: {
        '@type': 'Offer',
        price: '199',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: URL,
      },
    },
  ],
};

export default function VpnForCallsPage() {
  const t = useTranslations('vpn');
  const nav = useTranslations('nav');

  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Навигация" className="text-sm text-white/40 mb-10">
        <Link href="/" className="hover:text-white/70">
          {nav('brand')}
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
              <span aria-hidden className="text-accent">
                —
              </span>
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
        <Link href="/" className="hover:text-white/70">
          {t('footer_home')}
        </Link>
        <Link href="/privacy" className="hover:text-white/70">
          {t('footer_privacy')}
        </Link>
        <Link href="/terms" className="hover:text-white/70">
          {t('footer_terms')}
        </Link>
      </footer>
    </main>
  );
}