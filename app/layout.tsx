import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://relaxnet.pro'),

  title: {
    default: 'RelaxNet — VPN для звонков и доступа к нейросетям',
    template: '%s — RelaxNet',
  },
  description:
    'VPN со скоростью 100–200 Мбит/с: звонки в Telegram и WhatsApp, стабильный доступ к ChatGPT, Gemini и Claude. Час на проверку до оплаты.',

  applicationName: 'RelaxNet',
  manifest: '/site.webmanifest',

  alternates: {
    canonical: 'https://relaxnet.pro',
  },

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  openGraph: {
    title: 'RelaxNet — быстрый и надёжный VPN',
    description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
    url: 'https://relaxnet.pro',
    siteName: 'RelaxNet',
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'RelaxNet VPN' }],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RelaxNet — быстрый и надёжный VPN',
    description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
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

// JSON-LD структурированные данные — помогают поисковикам понять,
// что это за организация/сервис, и повышают шанс rich-сниппетов в выдаче
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RelaxNet',
  url: 'https://relaxnet.pro',
  description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
  logo: 'https://relaxnet.pro/favicon-96x96.png',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
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
        {children}
      </body>
    </html>
  );
}