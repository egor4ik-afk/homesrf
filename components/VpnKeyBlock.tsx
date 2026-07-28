'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildAmneziaVpnLink } from '@/lib/vpnLink';

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
  const [format, setFormat] = useState<'txt' | 'conf' | 'vpn'>('txt');
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
    // .vpn — родной формат AmneziaVPN: внутри лежит vpn://-ссылка, и iOS
    //        открывает такой файл именно в Amnezia (а не в WireGuard).
    // .conf/.txt — формат AmneziaWG / роутеров: внутри текст конфига.
    const payload = format === 'vpn' ? amneziaLink : config;
    const dataUrl =
      'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(payload);
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

  // iOS: share sheet с файлом .vpn (родной формат AmneziaVPN). Внутри —
  // vpn://-ссылка, поэтому система предлагает открыть его в Amnezia, а не
  // в WireGuard. Если приложение не появится в списке — путь тупиковый и
  // кнопку можно убрать, но сначала стоит проверить на живом устройстве.
  async function shareVpnFile() {
    try {
      const file = new File([amneziaLink], 'relaxnet.vpn', {
        type: 'application/octet-stream',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title || 'RelaxNet' });
        return;
      }
      // запасной путь, если файлами делиться нельзя — делимся ссылкой
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

          {isIOS ? (
            // iOS: копирование — главный путь. «Отправить в Amnezia» —
            // системная шторка с файлом .vpn (открывается в Amnezia).
            <div className="flex flex-col gap-2">
              <button
                onClick={() => copyToClipboard(amneziaLink, true)}
                className="w-full py-3 rounded-lg bg-accent text-bg text-sm font-medium transition hover:brightness-110"
              >
                {copiedLink ? 'Ключ скопирован ✓' : 'Скопировать ключ'}
              </button>
              <button
                onClick={shareVpnFile}
                className="w-full py-2.5 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition"
              >
                Отправить в Amnezia
              </button>
              <p className="text-white/40 text-xs mt-1 text-center">
                «Отправить в Amnezia» → в шторке выберите приложение или «Сохранить
                в Файлы». Если Amnezia в списке нет — скопируйте ключ и вставьте
                в приложении.
              </p>
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
                {copiedLink ? 'Скопировано ✓' : 'Скопировать ключ'}
              </button>
            </div>
          )}
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
            нажмите на всплывшую ссылку. Правый QR — для клиентов WireGuard.
          </p>
        </div>
      )}

      {/* 3. Файл */}
      {tab === 'file' && (
        <div className="py-2 animate-in fade-in">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-white/50">Формат:</span>
            {(['vpn', 'txt', 'conf'] as const).map((f) => (
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
            {format === 'vpn'
              ? 'Для приложения AmneziaVPN. На iPhone откройте скачанный файл — Amnezia добавит подключение сама.'
              : 'Для AmneziaWG и роутеров. .txt удобно посмотреть вручную, в приложение импортируется через «Добавить из файла».'}
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
    </section>
  );
}