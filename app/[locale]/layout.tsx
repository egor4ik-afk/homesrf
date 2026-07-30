import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import '../globals.css';
import { locales, rtlLocales, hreflangMap, defaultLocale, type Locale } from '@/i18n/config';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import Nav from '@/components/Nav';

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'meta' });

  const localePath = locale === defaultLocale ? '' : `/${locale}`;
  const canonical = `https://relaxnet.pro${localePath}`;

  const languages: Record<string, string> = {};
  locales.forEach((l) => {
    const p = l === defaultLocale ? '' : `/${l}`;
    languages[hreflangMap[l]] = `https://relaxnet.pro${p}`;
  });
  languages['x-default'] = 'https://relaxnet.pro';

  return {
    metadataBase: new URL('https://relaxnet.pro'),
    title: { default: t('home_title'), template: '%s — RelaxNet' },
    description: t('home_desc'),
    applicationName: 'RelaxNet',
    manifest: '/site.webmanifest',
    alternates: { canonical, languages },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title: t('home_title'),
      description: t('home_desc'),
      url: canonical,
      siteName: 'RelaxNet',
      locale: locale === 'ru' ? 'ru_RU' : locale,
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'RelaxNet VPN' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('home_title'),
      description: t('home_desc'),
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';
  const t = await getTranslations({ locale, namespace: 'meta' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RelaxNet',
    url: 'https://relaxnet.pro',
    description: t('home_desc'),
    logo: 'https://relaxnet.pro/favicon-96x96.png',
  };

  return (
    <html lang={locale} dir={dir}>
      <body className="bg-bg text-white min-h-screen antialiased">
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111144083', 'ym');
            ym(111144083, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/111144083" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <NextIntlClientProvider messages={messages}>
          <Nav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}