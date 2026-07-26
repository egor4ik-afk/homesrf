'use client';

import React from 'react';

interface VpnKeyBlockProps {
  config: string;
  title?: string;
}

export default function VpnKeyBlock({ config, title = 'amnezia' }: VpnKeyBlockProps) {
  const handleDownloadConfig = () => {
    if (!config) return;

    // Создаем Blob из строки конфига
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Формируем имя файла из title, заменяя пробелы на нижнее подчеркивание
    const safeFileName = title.replace(/\s+/g, '_');
    link.download = `${safeFileName}.conf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 mt-6">
      {/* Заголовок ключа, если он передан */}
      {title && (
        <div className="mb-5 pb-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}

      {/* Кнопка скачивания файла */}
      <button 
        onClick={handleDownloadConfig} 
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-white shadow-lg transition-all mb-6"
      >
        Скачать файл конфигурации
      </button>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Скачать клиент Amnezia:
        </h4>
        
        {/* flex-wrap спасает на мобилках — кнопки перенесутся на новую строку */}
        <div className="flex flex-wrap gap-2 text-white">
          <a href="https://amnezia.org/ru/downloads" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Windows</a>
          <a href="https://amnezia.org/ru/downloads" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">macOS</a>
          <a href="https://amnezia.org/ru/downloads" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">iOS</a>
          <a href="https://amnezia.org/ru/downloads" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Android</a>
          <a href="https://amnezia.org/ru/downloads" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Linux</a>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400 mt-4">
          <li>Установите и откройте клиент <span className="text-gray-200">Amnezia</span>.</li>
          <li>Нажмите кнопку «Скачать файл конфигурации» выше.</li>
          <li>В приложении выберите <span className="text-gray-200">Добавить конфигурацию из файла</span>.</li>
          <li>Подключитесь и пользуйтесь!</li>
        </ol>
      </div>
    </div>
  );
}