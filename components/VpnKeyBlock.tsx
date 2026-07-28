'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildAmneziaVpnLink } from '@/lib/vpnLink';

const STEPS: Record<string, string[]> = {
  'iPhone / iPad': [
    'Установите приложение AmneziaVPN из App Store',
    'На вкладке «Ссылка» нажмите «Открыть в Amnezia» — подключение добавится само',
    'Либо наведите на QR-код Amnezia обычную камеру телефона (не сканер внутри приложения) и нажмите на всплывшую ссылку',
    'Разрешите добавление VPN-конфигурации и включите тумблер',
  ],
  Android: [
    'Установите AmneziaVPN из Google Play',
    'На вкладке «Ссылка» нажмите «Открыть в Amnezia» либо скопируйте ссылку и вставьте в приложении',
    'Либо наведите на QR-код Amnezia камеру телефона и нажмите на всплывшую ссылку',
    'Включите тумблер подключения',
  ],
  'Windows / macOS / Linux': [
    'Скачайте файл конфига на вкладке «Файл»',
    'Установите клиент AmneziaVPN или AmneziaWG (ссылки на странице загрузок)',
    'В приложении: «Добавить» → «Импорт из файла» → выберите скачанный файл',
    'Нажмите «Подключиться»',
  ],
};

interface Props {
  config: string;
  title?: string;
  /** id строки vpn_clients — нужен для удаления. */
  clientId?: number | null;
  /** Колбэк после успешного удаления (родитель убирает ключ из списка). */
  onDelete?: (clientId: number) => void;
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export default function VpnKeyBlock({ config, title, clientId, onDelete }: Props) {
  const [tab, setTab] = useState<'link' | 'qr' | 'file' | 'text'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof STEPS>('iPhone / iPad');
  const [format, setFormat] = useState<'txt' | 'conf'>('txt');
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const canvasAmneziaRef = useRef<HTMLCanvasElement>(null);
  const canvasWgRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsIOS(detectIOS());
  }, []);

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

    if (canvasAmneziaRef.current && amneziaLink) {
      QRCode.toCanvas(
        canvasAmneziaRef.current,
        amneziaLink,
        { width: 320, margin: 2, errorCorrectionLevel: 'L' },
        (err) => err && console.error('QR Amnezia:', err),
      );
    }

    if (canvasWgRef.current) {
      QRCode.toCanvas(
        canvasWgRef.current,
        config,
        { width: 260, margin: 2, errorCorrectionLevel: 'M' },
        (err) => err && console.error('QR WG:', err),
      );
    }
  }, [tab, config, amneziaLink]);

  function download() {
    // Data-URL, а не Blob: Blob-скачивание не работает в iOS Safari.
    const dataUrl =
      'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(config);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `relaxnet.${format}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function openInAmnezia() {
    if (amneziaLink) window.location.href = amneziaLink;
  }

  // iOS: системный share sheet — единственный надёжный способ передать
  // ссылку/файл в приложение. В списке появляется «Скопировать» и, если
  // Amnezia установлена, действие открытия конфига.
  async function shareToAmnezia() {
    try {
      // Файлом Amnezia на iOS подхватывается надёжнее, чем vpn://-ссылкой.
      const file = new File([config], 'relaxnet.conf', {
        type: 'application/octet-stream',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title || 'RelaxNet' });
        return;
      }
      // Если файлами делиться нельзя — делимся ссылкой vpn://
      await navigator.share({ text: amneziaLink, title: title || 'RelaxNet' });
    } catch {
      /* пользователь закрыл шторку — не ошибка */
    }
  }

  async function copyToClipboard(text: string, isLink: boolean) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  }

  async function handleDelete() {
    if (!clientId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vpn/${clientId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось удалить ключ');
      onDelete?.(clientId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить ключ');
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        {title && <h2 className="text-lg font-medium">{title}</h2>}

        {clientId != null && (
          <div className="shrink-0">
            {confirming ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-2 py-1 rounded-md bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition"
                >
                  {deleting ? 'Удаляем…' : 'Точно удалить'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-xs text-white/30 hover:text-red-300 transition"
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-white/50 text-sm mb-4">
        Выберите удобный способ добавления конфига в приложение.
      </p>

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

      {/* 1. Ссылка */}
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

          {/* iOS: share sheet — самый надёжный путь в приложение.
              На остальных платформах — прямой переход по ссылке. */}
          {isIOS ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={shareToAmnezia}
                className="flex-1 py-3 rounded-lg bg-accent text-bg text-sm font-medium transition hover:brightness-110"
              >
                Отправить в Amnezia
              </button>
              <button
                onClick={() => copyToClipboard(amneziaLink, true)}
                className="flex-1 py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 font-medium transition"
              >
                {copiedLink ? 'Скопировано ✓' : 'Скопировать ссылку'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={openInAmnezia}
                className="flex-1 py-3 rounded-lg bg-accent text-bg text-sm font-medium transition hover:brightness-110"
              >
                Открыть в Amnezia
              </button>
              <button
                onClick={() => copyToClipboard(amneziaLink, true)}
                className="flex-1 py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 font-medium transition"
              >
                {copiedLink ? 'Скопировано ✓' : 'Скопировать ссылку'}
              </button>
            </div>
          )}

          <p className="text-white/40 text-xs mt-2 text-center">
            {isIOS
              ? 'На iPhone нажмите «Отправить в Amnezia» и выберите приложение в списке. Amnezia должна быть установлена.'
              : 'Самый быстрый способ: на телефоне подключение добавляется в одно касание.'}
          </p>
        </div>
      )}

      {/* 2. QR */}
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
            Сканируйте QR-код Amnezia обычной камерой телефона со второго устройства и
            нажмите на всплывшую ссылку — приложение откроется само. Правый QR — для клиентов
            WireGuard.
          </p>
        </div>
      )}

      {/* 3. Файл */}
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
            onClick={download}
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

      {/* 4. Конфиг */}
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