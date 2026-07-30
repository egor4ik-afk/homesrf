import type { MetadataRoute } from 'next';
import { locales, hreflangMap, defaultLocale } from '@/i18n/config';

const BASE = 'https://relaxnet.pro';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages = [
    { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/vpn-dlya-zvonkov', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  return pages.flatMap((page) => {
    const isRoot = page.path === '/';
    const pagePath = isRoot ? '' : page.path;

    return locales.map((locale) => {
      const localePath = locale === defaultLocale ? '' : `/${locale}`;
      let url = `${BASE}${localePath}${pagePath}`;
      if (isRoot && locale === defaultLocale) {
        url = `${BASE}/`;
      }

      const languages: Record<string, string> = {};
      locales.forEach((l) => {
        const langLocalePath = l === defaultLocale ? '' : `/${l}`;
        let langUrl = `${BASE}${langLocalePath}${pagePath}`;
        if (isRoot && l === defaultLocale) {
            langUrl = `${BASE}/`;
        }
        languages[hreflangMap[l]] = langUrl;
      });
      languages['x-default'] = isRoot ? `${BASE}/` : `${BASE}${pagePath}`;

      return {
        url,
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages,
        },
      };
    });
  });
}
