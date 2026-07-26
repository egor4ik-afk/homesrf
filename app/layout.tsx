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
  
  icons: {
    // Явно указываем shortcut, чтобы старые браузеры и Safari не тупили
    shortcut: '/favicon.ico', 
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  openGraph: {
    title: 'RelaxNet — быстрый и надёжный VPN',
    description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
    url: 'https://relaxnet.pro',
    siteName: 'RelaxNet',
    locale: 'ru_RU',
    type: 'website',
    // Если кинешь картинку 1200x630 в папку public под именем og-image.png, она будет красиво отображаться в Telegram/VK
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
    // images: ['/og-image.png'], // Раскомментируй, когда добавишь картинку
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-bg text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}