import { locales, hreflangMap, defaultLocale, type Locale } from '@/i18n/config';

const BASE = 'https://relaxnet.pro';

export function localeUrl(locale: string, path = '') {
  const p = locale === defaultLocale ? '' : `/${locale}`;
  return `${BASE}${p}${path}`;
}

export function buildAlternates(locale: string, path = '') {
  const languages: Record<string, string> = {};
  locales.forEach((l) => {
    languages[hreflangMap[l as Locale]] = localeUrl(l, path);
  });
  languages['x-default'] = localeUrl(defaultLocale, path);

  return {
    canonical: localeUrl(locale, path),
    languages,
  };
}
