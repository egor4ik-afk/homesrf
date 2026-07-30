// app/sitemap.ts  →  СОЗДАТЬ
// Next.js сам отдаст его по /sitemap.xml. Только канонические,
// индексируемые страницы. /login и /profile сюда НЕ включаем — они под
// noindex (личный кабинет). privacy/terms — черновики, priority низкий.
//
// Когда добавишь локали (app/[locale]/...), в каждый элемент можно
// доложить alternates.languages с hreflang — заготовка внизу в комментарии.

import type { MetadataRoute } from 'next';

const BASE = 'https://relaxnet.pro';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/vpn-dlya-zvonkov`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // ── Когда появятся локали, каждый пункт станет таким: ──────────────
  // {
  //   url: `${BASE}/en`,
  //   lastModified,
  //   alternates: {
  //     languages: {
  //       ru: `${BASE}/`,
  //       en: `${BASE}/en`,
  //       es: `${BASE}/es`,
  //       zh: `${BASE}/zh`,
  //       ar: `${BASE}/ar`,
  //     },
  //   },
  // },
}