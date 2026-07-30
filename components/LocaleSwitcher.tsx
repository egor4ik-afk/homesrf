'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/config';

// Данные для флагов и полных названий
const LOCALES_DATA: Record<Locale, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Español', flag: '🇪🇸' },
  zh: { name: '中文', flag: '🇨🇳' },
  ar: { name: 'العربية', flag: '🇸🇦' }
};

const TEST_LOCALES: Locale[] = ['ru', 'en', 'es', 'zh', 'ar'];

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const current = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentData = LOCALES_DATA[current] || LOCALES_DATA.ru;

  const switchLanguage = (newLocale: Locale) => {
    setIsOpen(false);
    startTransition(() => {
      // Подменяем локаль, оставаясь на текущем пути
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none disabled:opacity-50"
      >
        <span className="text-lg leading-none">{currentData.flag}</span>
        <span>{current.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute end-0 z-20 mt-2 w-36 origin-top rounded-lg bg-[#1a1a1a] border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
            <div className="py-1">
              {TEST_LOCALES.map((loc) => {
                const data = LOCALES_DATA[loc];
                return (
                  <button
                    key={loc}
                    onClick={() => switchLanguage(loc)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                      loc === current
                        ? 'bg-white/5 text-accent font-semibold'
                        : 'text-white/70'
                    }`}
                  >
                    <span className="text-lg leading-none">{data.flag}</span>
                    {data.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}