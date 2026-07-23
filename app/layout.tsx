import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RelaxNet — быстрый и надёжный VPN',
  description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'RelaxNet — быстрый и надёжный VPN',
    description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
    url: 'https://relaxnet.pro',
    siteName: 'RelaxNet',
    locale: 'ru_RU',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-bg text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}