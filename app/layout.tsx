import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  // Базовый URL обязателен в Next.js для корректной генерации абсолютных ссылок в OG
  metadataBase: new URL('https://relaxnet.pro'),

  title: 'RelaxNet — быстрый и надёжный VPN',
  description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
  keywords: ['VPN', 'купить VPN', 'быстрый VPN', 'WireGuard', 'AmneziaWG', 'обход блокировок', 'VPN для телефона'],

  manifest: '/site.webmanifest',

  // Канонический URL — фиксирует основной адрес сайта для поисковиков,
  // чтобы не было путаницы между https://relaxnet.pro и возможными
  // дублями (www., с query-параметрами и т.д.)
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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RelaxNet VPN',
      }
    ]
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