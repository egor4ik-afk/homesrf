'use client';

import React, { useRef } from 'react';

interface VpnKeyBlockProps {
  config: string;
  title?: string;
}

export default function VpnKeyBlock({ config, title = 'amnezia' }: VpnKeyBlockProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleDownloadConfig = () => {
    if (!config) return;
    // Настоящий сабмит формы = нативная HTTP-загрузка с Content-Disposition:
    // attachment на сервере. Работает и в обычных браузерах, и во встроенных
    // webview (Telegram, ВК и т.п.), где JS-скачивание через Blob часто заблокировано.
    formRef.current?.requestSubmit();
  };

  const safeFileName = title.replace(/\s+/g, '_');

  return (
    <div className="w-full flex items-center justify-between gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
      <span className="text-sm font-medium text-white truncate">{title}</span>

      {/* Скрытая форма — реальный POST на сервер, ответ приходит с
          Content-Disposition: attachment, браузер сам скачивает файл */}
      <form ref={formRef} action="/api/vpn/download" method="POST" target="_self" className="hidden">
        <input type="hidden" name="config" value={config} />
        <input type="hidden" name="filename" value={safeFileName} />
      </form>

      <button
        onClick={handleDownloadConfig}
        className="shrink-0 px-4 py-2 bg-accent hover:brightness-110 rounded-lg font-medium text-bg text-sm transition-all"
      >
        Скачать конфиг
      </button>
    </div>
  );
}