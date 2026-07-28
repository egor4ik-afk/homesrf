'use client';

import { useEffect, useState } from 'react';

const STEPS: Record<string, string[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaVPN из App Store',
    'На вкладке «Файл» выберите формат .vpn и нажмите «Скачать» → «Сохранить в Файлы»',
    'Откройте сохранённый файл в «Файлах» — он запустится в Amnezia и добавит подключение',
    'Если файл не открылся — нажмите «Скопировать ключ» и в Amnezia выберите «Добавить из буфера обмена»',
    'Включите тумблер подключения',
  ],
  Android: [
    'Установите AmneziaVPN из Google Play',
    'В блоке ключа нажмите «Открыть в Amnezia» — подключение добавится само',
    'Либо «Скопировать ключ» и вставьте его в приложении',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    'Установите клиент AmneziaVPN или AmneziaWG (ссылки на странице загрузок)',
    'На вкладке «Файл» скачайте конфиг',
    'В приложении: «Добавить» → «Импорт из файла» → выберите скачанный файл',
    'Нажмите «Подключиться»',
  ],
};

const STORAGE_KEY = 'relaxnet_help_collapsed';

export default function VpnHelp() {
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
    <section className="rounded-xl border border-border bg-card p-5 mb-4">
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
            {STEPS[platform].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/70">
                <span className="text-accent font-medium shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}