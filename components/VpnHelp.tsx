'use client';

import { useEffect, useState } from 'react';

type Step = string | { text: string; linkLabel: string };

const STEPS: Record<string, Step[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaVPN из App Store',
    'Основной способ: в блоке ключа нажмите «Скопировать ключ», откройте Amnezia → «+» → «Добавить из буфера обмена» (или «Вставить») и подключение добавится',
    'Запасной способ: на вкладке «Файл» выберите формат .vpn, нажмите «Скачать» → «Сохранить в Файлы»',
    'Откройте сохранённый файл в приложении «Файлы» — он запустится в Amnezia и добавит подключение',
    'Включите тумблер подключения',
  ],
  Android: [
    'Установите AmneziaVPN из Google Play',
    'В блоке ключа нажмите «Открыть в Amnezia» — подключение добавится само',
    'Либо «Скопировать ключ» и вставьте его в приложении',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    { text: 'Скачайте клиент AmneziaVPN или AmneziaWG со страницы загрузок:', linkLabel: 'страница загрузок' },
    'На вкладке «Файл» скачайте конфиг (.conf или .txt)',
    'В приложении: «Добавить» → «Импорт из файла» → выберите скачанный файл',
    'Нажмите «Подключиться»',
  ],
};

const STORAGE_KEY = 'relaxnet_help_collapsed';

export default function VpnHelp({ downloadsUrl }: { downloadsUrl?: string }) {
  // По умолчанию развёрнута; при первом рендере поднимаем сохранённый выбор.
  const [collapsed, setCollapsed] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof STEPS>('iPhone / iPad');
  const [hydrated, setHydrated] = useState(false);

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

  // до гидрации не мигаем состоянием — рендерим развёрнутую статически
  const showBody = !hydrated ? true : !collapsed;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-4">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="text-base font-medium">Как подключиться</span>
        <span className="text-white/40 text-sm shrink-0">
          {showBody ? 'Свернуть ▲' : 'Показать ▼'}
        </span>
      </button>

      {showBody && (
        <div className="mt-4 animate-in fade-in">
          <div className="flex gap-2 mb-3 flex-wrap">
            {(Object.keys(STEPS) as (keyof typeof STEPS)[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1 rounded-md text-xs transition ${
                  platform === p ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <ol className="space-y-2">
            {STEPS[platform].map((step, i) => {
              const isLink = typeof step !== 'string';
              const text = isLink ? step.text : step;
              return (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="text-accent font-medium shrink-0">{i + 1}.</span>
                  <span>
                    {text}
                    {isLink && downloadsUrl && (
                      <>
                        {' '}
                        <a
                          href={downloadsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline hover:brightness-110"
                        >
                          {step.linkLabel}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}