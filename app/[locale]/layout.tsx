import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, rtlLocales, type Locale } from '@/i18n/config';
import LocaleSwitcher from '@/components/LocaleSwitcher';
// ...остальные твои импорты (Script метрики, globals.css и т.д.)

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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

  return (
    <html lang={locale} dir={dir}>
      <body className="bg-bg text-white min-h-screen antialiased">
        <div className="max-w-3xl mx-auto px-6 pt-4 flex justify-end">
          <LocaleSwitcher />
        </div>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
