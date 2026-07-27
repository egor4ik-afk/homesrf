'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildAmneziaVpnLink } from '@/lib/vpnLink';

const STEPS: Record<string, string[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaVPN из App Store',
    'На вкладке «Ссылка» нажмите «Открыть в Amnezia» — подключение добавится само',
    'Либо «+» → «Создать из QR-кода» и наведите камеру на QR-код Amnezia',
    'Разрешите добавление VPN-конфигурации и включите тумблер',
  ],
  Android: [
    'Установите AmneziaVPN из Google Play',
    'На вкладке «Ссылка» нажмите «Открыть в Amnezia» либо скопируйте ссылку и вставьте в приложении',
    'Либо «+» → «Сканировать QR-код» и наведите камеру на QR-код Amnezia',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    'Скачайте файл конфига на вкладке «Файл»',
    'Установите клиент AmneziaVPN или AmneziaWG (ссылки на странице загрузок)',
    'В приложении: «Добавить» → «Импорт из файла» → выберите скачанный файл',
    'Нажмите «Подключиться»',
  ],
};

export default function VpnKeyBlock({ config, title }: { config: string; title?: string }) {
  const [tab, setTab] = useState<'link' | 'qr' | 'file' | 'text'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof STEPS>('iPhone / iPad');
  const [format, setFormat] = useState<'txt' | 'conf'>('txt');

  const canvasAmneziaRef = useRef<HTMLCanvasElement>(null);
  const canvasWgRef = useRef<HTMLCanvasElement>(null);

  // Ссылка vpn:// в родном формате Amnezia (контейнер amnezia-awg2)
  const amneziaLink = useMemo(() => {
    if (!config) return '';
    try {
      return buildAmneziaVpnLink(config, { description: title || 'RelaxNet' });
    } catch {
      return '';
    }
  }, [config, title]);

  useEffect(() => {
    if (tab !== 'qr') return;

    // Ссылка длинная (~1300 символов), поэтому уровень коррекции L и
    // размер побольше — иначе модули мельчают и камера их не берёт.
    if (canvasAmneziaRef.current && amneziaLink) {
      QRCode.toCanvas(canvasAmneziaRef.current, amneziaLink, {
        width: 300,
        margin: 1,
        errorCorrectionLevel: 'L',
        color: { dark: '#000000', light: '#ffffff' },
      });
    }

    if (canvasWgRef.current) {
      QRCode.toCanvas(canvasWgRef.current, config, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [tab, config, amneziaLink]);

  function downloadConf() {
    const blob = new Blob([config], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relaxnet.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
            ['link', '1. Ссылка vpn://'],
            ['qr', '2. QR-коды'],
            ['file', '3. Файл'],
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

      {/* 1. Вкладка: Ссылка vpn:// */}
      {tab === 'link' && (
        <div className="py-2 animate-in fade-in">
          <div className="flex gap-2 items-center bg-black/40 rounded-lg p-2 mb-2 border border-white/10">
            <input
              type="text"
              readOnly
              value={amneziaLink}
              onFocus={(e) => e.currentTarget.select()}
              className="bg-transparent w-full text-sm text-white/70 outline-none truncate"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={amneziaLink || undefined}
              className="flex-1 py-3 rounded-lg bg-accent text-bg text-sm font-medium text-center transition hover:brightness-110"
            >
              Открыть в Amnezia
            </a>
            <button
              onClick={() => copyToClipboard(amneziaLink, true)}
              className="flex-1 py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 font-medium transition"
            >
              {copiedLink ? 'Скопировано ✓' : 'Скопировать ссылку'}
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2 text-center">
            Самый быстрый способ: на телефоне подключение добавляется в одно касание.
          </p>
        </div>
      )}

      {/* 2. Вкладка: 2 QR-кода рядом */}
      {tab === 'qr' && (
        <div className="flex flex-col items-center py-2 animate-in fade-in">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
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

      {/* 3. Вкладка: Файл */}
      {tab === 'file' && (
        <div className="py-2 animate-in fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-white/50">Формат:</span>
            {(['txt', 'conf'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1 rounded-md text-xs transition ${
                  format === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                .{f}
              </button>
            ))}
          </div>
          <button
            onClick={downloadConf}
            className="w-full py-3 rounded-lg bg-accent text-bg font-medium"
          >
            Скачать relaxnet.{format}
          </button>
          <p className="text-white/40 text-xs mt-2 text-center">
            {format === 'conf'
              ? 'Файл .conf Amnezia открывает по умолчанию.'
              : 'Файл .txt проще посмотреть вручную, в Amnezia импортируется так же.'}
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