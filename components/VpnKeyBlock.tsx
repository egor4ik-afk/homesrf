'use client';

import React from 'react';

interface VpnKeyBlockProps {
  config: string;
  title?: string;
}

export default function VpnKeyBlock({ config, title = 'amnezia' }: VpnKeyBlockProps) {
  const handleDownloadConfig = () => {
    if (!config) return;

    // application/octet-stream вместо text/plain — иначе iOS Safari
    // открывает содержимое как текстовую страницу вместо сохранения файла
    const blob = new Blob([config], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const safeFileName = title.replace(/\s+/g, '_');
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