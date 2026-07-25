'use client';

/**
 * components/VpnKeyBlock.tsx — блок ключа в профиле.
 * Вставляется в ProfileClient вместо старого <div> с голым vpn_key:
 *
 *   {isActive && user.vpn_key && <VpnKeyBlock config={user.vpn_key} />}
 *
 * Три способа получить конфиг + инструкция:
 *   1) скачать .conf файлом (десктоп, импорт файла в приложении)
 *   2) показать QR (телефон/планшет — самый быстрый путь)
 *   3) скопировать текст (запасной, работает везде)
 *
 * QR — это сам текст .conf: приложения AmneziaWG/AmneziaVPN читают его
 * сканером «Импорт из QR». Зависимость: npm i qrcode
 */

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

const STEPS: Record<string, string[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaWG из App Store',
    'Откройте его и нажмите «+» → «Создать из QR-кода»',
    'Наведите камеру на QR-код ниже',
    'Разрешите добавление VPN-конфигурации и включите тумблер',
  ],
  Android: [
    'Установите AmneziaWG из Google Play',
    'Нажмите «+» → «Сканировать QR-код» и наведите камеру на QR ниже',
    'Либо скачайте файл .conf и выберите «+» → «Импорт из файла»',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    'Скачайте файл relaxnet.conf кнопкой ниже',
    'Установите клиент AmneziaVPN или AmneziaWG (ссылки на странице загрузок)',
    'В приложении: «Добавить» → «Импорт из файла» → выберите relaxnet.conf',
    'Нажмите «Подключиться»',
  ],
};

export default function VpnKeyBlock({ config }: { config: string }) {
  const [tab, setTab] = useState<'qr' | 'file' | 'text'>('qr');
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof STEPS>('iPhone / iPad');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (tab === 'qr' && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, config, {
        width: 260,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [tab, config]);

  function downloadConf() {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relaxnet.conf';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyText() {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 mb-6">
      <h2 className="text-lg font-medium mb-1">Подключение</h2>
      <p className="text-white/50 text-sm mb-4">
        Один конфиг работает на одном устройстве одновременно.
      </p>

      {/* способ получения */}
      <div className="flex gap-2 mb-4">
        {(
          [
            ['qr', 'QR-код'],
            ['file', 'Файл'],
            ['text', 'Текст'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm transition ${
              tab === key ? 'bg-accent text-bg font-medium' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'qr' && (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="bg-white p-3 rounded-xl">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-white/40 text-xs">
            Отсканируйте в приложении AmneziaWG: «+» → «Импорт из QR-кода»
          </p>
        </div>
      )}

      {tab === 'file' && (
        <div className="py-2">
          <button
            onClick={downloadConf}
            className="w-full py-3 rounded-lg bg-accent text-bg font-medium"
          >
            Скачать relaxnet.conf
          </button>
          <p className="text-white/40 text-xs mt-2">
            Импортируйте файл в приложении AmneziaVPN или AmneziaWG
          </p>
        </div>
      )}

      {tab === 'text' && (
        <div className="py-2">
          <pre className="bg-black/40 rounded-lg p-3 text-xs text-white/70 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
            {config}
          </pre>
          <button
            onClick={copyText}
            className="mt-2 w-full py-2.5 rounded-lg bg-white/10 text-sm hover:bg-white/15"
          >
            {copied ? 'Скопировано ✓' : 'Скопировать'}
          </button>
        </div>
      )}

      {/* инструкция по платформам */}
      <div className="mt-6 border-t border-border pt-4">
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
    </section>
  );
}