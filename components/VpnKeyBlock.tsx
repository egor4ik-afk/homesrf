'use client';

import React from 'react';

interface VpnKeyBlockProps {
  config: string;
  title?: string;
}

export default function VpnKeyBlock({ config, title = 'amnezia' }: VpnKeyBlockProps) {
  const handleDownloadConfig = () => {
    if (!config) return;

    const blob = new Blob([config], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const safeFileName = title.replace(/\s+/g, '_');

    // iOS Safari блокирует window.open() для blob-URL (известный баг WebKit —
    // ничего не происходит, ни ошибки, ни шеринга). Рабочий вариант — перевести
    // на blob-URL текущую вкладку: Safari покажет содержимое с кнопкой "Поделиться"
    // в углу экрана, откуда можно сохранить файл в Файлы. Назад — обычная кнопка "Назад".
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.conf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
      <span className="text-sm font-medium text-white truncate">{title}</span>
      <button
        onClick={handleDownloadConfig}
        className="shrink-0 px-4 py-2 bg-accent hover:brightness-110 rounded-lg font-medium text-bg text-sm transition-all"
      >
        Скачать конфиг
      </button>
    </div>
  );
}