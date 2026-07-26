'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

const STEPS: Record<string, string[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaWG или AmneziaVPN из App Store',
    'Откройте его и нажмите «+» → «Создать из QR-кода»',
    'Наведите камеру на QR-код (вкладка QR-коды)',
    'Разрешите добавление VPN-конфигурации и включите тумблер',
  ],
  Android: [
    'Установите AmneziaWG или AmneziaVPN из Google Play',
    'Нажмите «+» → «Сканировать QR-код» и наведите камеру на QR-код',
    'Либо скопируйте ссылку (vpn://) и вставьте в приложение',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    'Скачайте файл relaxnet.conf (вкладка Файл)',
    'Установите клиент AmneziaVPN или AmneziaWG (ссылки на странице загрузок)',
    'В приложении: «Добавить» → «Импорт из файла» → выберите скачанный файл',
    'Нажмите «Подключиться»',
  ],
};

export default function VpnKeyBlock({ config, title }: { config: string, title?: string }) {
  const [tab, setTab] = useState<'file' | 'link' | 'qr' | 'text'>('file');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof STEPS>('iPhone / iPad');
  
  const canvasAmneziaRef = useRef<HTMLCanvasElement>(null);
  const canvasWgRef = useRef<HTMLCanvasElement>(null);

  // Генерируем безопасную ссылку vpn://
  const amneziaLink = typeof window !== 'undefined' 
    ? `vpn://${btoa(unescape(encodeURIComponent(config)))}` 
    : '';

  useEffect(() => {
    if (tab === 'qr') {
      const qrOptions = {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M' as const,
        color: { dark: '#000000', light: '#ffffff' },
      };
      
      // QR для Amnezia (ссылка)
      if (canvasAmneziaRef.current && amneziaLink) {
        QRCode.toCanvas(canvasAmneziaRef.current, amneziaLink, qrOptions);
      }
      
      // QR для сырого конфига (WG)
      if (canvasWgRef.current) {
        QRCode.toCanvas(canvasWgRef.current, config, qrOptions);
      }
    }
  }, [tab, config, amneziaLink]);

  function downloadConf() {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relaxnet.conf';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text: string, isLink: boolean) {
    await navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      {title && <h2 className="text-lg font-medium mb-1">{title}</h2>}
      <p className="text-white/50 text-sm mb-4">
        Выберите удобный способ добавления конфига в приложение.
      </p>

      {/* Навигация 4 вкладки */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(
          [
            ['file', '1. Файл'],
            ['link', '2. Ссылка vpn://'],
            ['qr', '3. QR-коды'],
            ['text', '4. Конфиг'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
              tab === key ? 'bg-accent text-bg font-medium' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 1. Вкладка: Файл */}
      {tab === 'file' && (
        <div className="py-2 animate-in fade-in">
          <button
            onClick={downloadConf}
            className="w-full py-3 rounded-lg bg-accent text-bg font-medium"
          >
            Скачать relaxnet.conf
          </button>
          <p className="text-white/40 text-xs mt-2 text-center">
            Лучший вариант для Windows, macOS и Linux. Импортируйте файл в приложении.
          </p>
        </div>
      )}

      {/* 2. Вкладка: Ссылка vpn:// */}
      {tab === 'link' && (
        <div className="py-2 animate-in fade-in">
          <div className="flex gap-2 items-center bg-black/40 rounded-lg p-2 mb-2 border border-white/10">
            <input 
              type="text" 
              readOnly 
              value={amneziaLink} 
              className="bg-transparent w-full text-sm text-white/70 outline-none truncate"
            />
          </div>
          <button
            onClick={() => copyToClipboard(amneziaLink, true)}
            className="w-full py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 font-medium transition"
          >
            {copiedLink ? 'Ссылка скопирована ✓' : 'Скопировать ссылку'}
          </button>
          <p className="text-white/40 text-xs mt-2 text-center">
            Удобно для Android. Скопируйте и вставьте прямо в приложении Amnezia.
          </p>
        </div>
      )}

      {/* 3. Вкладка: 2 QR-кода рядом */}
      {tab === 'qr' && (
        <div className="flex flex-col items-center py-2 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full">
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/60 mb-2">Для AmneziaVPN</span>
              <div className="bg-white p-2 rounded-xl">
                <canvas ref={canvasAmneziaRef} />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/60 mb-2">Для WireGuard</span>
              <div className="bg-white p-2 rounded-xl">
                <canvas ref={canvasWgRef} />
              </div>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-4 text-center">
            Наведите камеру смартфона прямо из приложения VPN.
          </p>
        </div>
      )}

      {/* 4. Вкладка: Текст конфига */}
      {tab === 'text' && (
        <div className="py-2 animate-in fade-in">
          <pre className="bg-black/40 rounded-lg p-3 text-xs text-white/70 overflow-x-auto max-h-48 whitespace-pre-wrap break-all border border-white/10">
            {config}
          </pre>
          <button
            onClick={() => copyToClipboard(config, false)}
            className="mt-2 w-full py-2.5 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition"
          >
            {copiedText ? 'Текст скопирован ✓' : 'Скопировать текст'}
          </button>
        </div>
      )}

      {/* Инструкция по платформам */}
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