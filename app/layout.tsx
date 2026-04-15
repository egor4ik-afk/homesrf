import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Укажи здесь свой реальный домен, когда он будет
const siteUrl = 'https://homesrf.ru'; 

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B3A5C', // Фирменный темно-синий цвет для мобильного браузера
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ХОМС РФ — Дедуктивный поиск и 3D-строительство недвижимости в Сочи',
    template: '%s | ХОМС РФ',
  },
  description: 'Инновационное агентство недвижимости в Сочи. Находим лучшие участки, квартиры и строим дома по технологии 3D-печати. Хомс найдет дом для вас где угодно!',
  authors: [{ name: 'HOMESRF Team', url: siteUrl }],
  creator: 'HOMESRF',
  publisher: 'HOMESRF',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    title: 'ХОМС РФ — Дедуктивный поиск и 3D-строительство в Сочи',
    description: 'Инновационное агентство недвижимости в Сочи. 3D-печать домов за 40 дней, проверенная вторичка и инвестиционные новостройки.',
    siteName: 'ХОМС РФ',
    images: [{ url: '/bg.webp', width: 1200, height: 630, alt: 'Платформа недвижимости ХОМС РФ' }], // Создай или закинь картинку bg.webp в папку public
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ХОМС РФ — Недвижимость в Сочи',
    description: 'Дедуктивный поиск и 3D-строительство недвижимости.',
    images: ['/bg.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

// Микроразметка Schema.org для Яндекса и Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'ХОМС РФ',
  image: `${siteUrl}/bg.webp`,
  url: siteUrl,
  telephone: '+7 (800) 000-00-00', // Укажи свой номер
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Сочи',
    addressCountry: 'RU',
  },
  description: 'Инновационное агентство недвижимости в Сочи и 3D-строительство ИЖС.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      
      {/* antialiased делает шрифты более гладкими на Mac */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[#F5F5F0] text-[#1B3A5C]`}>
        
        {/* МЕСТО ДЛЯ ЯНДЕКС.МЕТРИКИ (Замени номер ym(12345678, "init") на свой) */}
        {/* <Script id="yandex-metrika" strategy="lazyOnload">
          {`(function(){setTimeout(function(){(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(12345678,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});},3000)})();`}
        </Script> */}

        {/* Здесь можно добавить глобальный Header, если он есть */}
        
        {/* Основной контент */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Здесь можно добавить глобальный Footer, если он есть */}
      </body>
    </html>
  );
}