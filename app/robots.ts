// app/robots.ts  →  СОЗДАТЬ
// Отдаётся по /robots.txt. Disallow только /api/ — там индексировать
// нечего. /login и /profile закрываются НЕ здесь, а через noindex в самих
// страницах: Disallow не убирает из индекса, а лишь запрещает обход, и
// тогда робот не увидит noindex. Служебные пути можно смело запрещать.

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://relaxnet.pro/sitemap.xml',
    host: 'https://relaxnet.pro', // директива для Яндекса
  };
}