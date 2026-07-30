'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/config';

// На тесте показываем только RU/EN, хотя Locale типизирован под все 5 —
// когда добавишь переводы es/zh/ar, просто впиши их сюда.
const TEST_LOCALES: Locale[] = ['ru', 'en'];
const LABELS: Record<Locale, string> = { ru: 'RU', en: 'EN', es: 'ES', zh: '中文', ar: 'AR' };

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const current = useLocale() as Locale;

  return (
    <div className="flex gap-3 text-sm">
      {TEST_LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === current}
          className={
            loc === current
              ? 'font-semibold text-white'
              : 'text-white/50 hover:text-white transition-colors'
          }
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
