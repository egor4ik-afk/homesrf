// i18n/config.ts
export const locales = ['ru', 'en', 'es', 'zh', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';
 
// Арабский — единственный RTL. Список, чтобы не хардкодить в разметке.
export const rtlLocales: Locale[] = ['ar'];
 
// hreflang-коды для <link rel="alternate">. ru→ru-RU и т.д.
export const hreflangMap: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en',
  es: 'es',
  zh: 'zh-Hans',
  ar: 'ar',
};