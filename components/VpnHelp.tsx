'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Step = string | { text: string; link: true };

const STORAGE_KEY = 'relaxnet_help_collapsed';

export default function VpnHelp({ downloadsUrl }: { downloadsUrl?: string }) {
  const t = useTranslations('vpnHelp');
  const [collapsed, setCollapsed] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [hydrated, setHydrated] = useState(false);

  const TABS: Record<'ios' | 'android' | 'desktop', string> = {
    ios: t('tab_ios'),
    android: t('tab_android'),
    desktop: t('tab_desktop'),
  };

  const STEPS: Record<'ios' | 'android' | 'desktop', Step[]> = {
    ios: [
      { text: t('ios_step1'), link: true },
      t('ios_step2'),
      t('ios_step3'),
      t('ios_step4'),
    ],
    android: [
      { text: t('android_step1'), link: true },
      t('android_step2'),
      t('android_step3'),
      t('android_step4'),
    ],
    desktop: [
      { text: t('desktop_step1'), link: true },
      t('desktop_step2'),
      t('desktop_step3'),
      t('desktop_step4'),
    ],
  };

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* localStorage недоступен — оставляем развёрнутой */
    }
    setHydrated(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* не критично */
    }
  }

  const showBody = !hydrated ? true : !collapsed;

  return (
    <>
      {downloadsUrl && (
        <section className="rounded-xl border border-border bg-card px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/70 min-w-0">
            {t('install_prompt_pre')}
            <span className="text-white font-medium">{t('app_name')}</span>
            {t('install_prompt_post')}
          </p>
          <a
            href={downloadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-lg bg-accent text-bg text-sm font-medium transition hover:brightness-110"
          >
            {t('download')}
          </a>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-4">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="text-base font-medium">{t('how_to_connect')}</span>
          <span className="text-white/40 text-sm shrink-0">
            {showBody ? t('collapse') : t('expand')}
          </span>
        </button>

        {showBody && (
          <div className="mt-4 animate-in fade-in">
            <div className="flex gap-2 mb-3 flex-wrap">
              {(Object.keys(TABS) as (keyof typeof TABS)[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1 rounded-md text-xs transition ${
                    platform === p ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {TABS[p]}
                </button>
              ))}
            </div>
            <ol className="space-y-2 list-none">
              {STEPS[platform].map((step, i) => {
                const isLink = typeof step !== 'string';
                const text = isLink ? step.text : step;
                return (
                  <li key={i} className="flex gap-3 text-sm text-white/70">
                    <span className="text-accent font-medium shrink-0">{i + 1}.</span>
                    <span>
                      {text}
                      {isLink && downloadsUrl && (
                      <a
                          href={downloadsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline hover:brightness-110"
                        >
                          {t('download_link')}
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </>
  );
}