"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import House3DViewer from '@/components/House3DViewer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/catalog?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F5F5F0]">
      
      {/* 1. HERO-СЕКЦИЯ С ВИДЕО-ФОНОМ И УМНЫМ ПОИСКОМ */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Фоновое видео */}
        <div className="absolute inset-0 z-0 bg-[#1B3A5C]">
          <video 
            className="absolute top-0 left-0 w-full h-full object-cover opacity-70"
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src="https://cdn.relaxdev.ru/homes/1.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
          {/* Градиент для читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C] via-[#1B3A5C]/40 to-transparent"></div>
        </div>

        {/* Контент поверх видео */}
        <div className="relative z-10 w-full max-w-5xl px-4 mx-auto text-center mt-16">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
            Хомс найдет дом для вас <br className="hidden md:block"/> 
            <span className="text-[#2D7A4F]">где угодно</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12 drop-shadow-md max-w-3xl mx-auto">
            Дедуктивный подход к недвижимости и инновационное 3D-строительство. Опишите вашу цель своими словами.
          </p>

          {/* Умная форма поиска */}
          <form 
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl transition-all hover:bg-white/15"
          >
            <div className="flex-grow w-full relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Например: Ищу участок с видом на море до 15 млн..."
                className="w-full bg-transparent text-white placeholder-gray-300 text-lg px-14 py-4 focus:outline-none focus:ring-0"
              />
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto mt-4 md:mt-0 md:ml-4 bg-[#2D7A4F] hover:bg-[#225f3d] text-white font-bold py-4 px-10 rounded-xl transition-colors shadow-lg whitespace-nowrap text-lg"
            >
              Начать расследование
            </button>
          </form>
        </div>
      </section>

      {/* 2. НАШИ НАПРАВЛЕНИЯ (4 КЛЮЧЕВЫЕ КАТЕГОРИИ) */}
      <section className="py-24 bg-white relative -mt-10 rounded-t-[40px] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1B3A5C]">Ключевые направления</h2>
            <p className="text-gray-500 mt-4 text-xl">Выберите то, что подходит именно вам</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1: 3D Дома */}
            <Link href="/projects" className="group flex flex-col h-[400px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative border border-gray-100">
              <Image src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop" alt="3D Строительство" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C]/90 via-[#1B3A5C]/40 to-transparent"></div>
              <div className="relative mt-auto p-8 z-10">
                <span className="bg-[#2D7A4F] text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full mb-4 inline-block">Инновация</span>
                <h3 className="text-2xl font-bold text-white mb-2">3D-Дома ИЖС</h3>
                <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">Технология 3D-печати. Возведение за 40 дней от 40 000 ₽/м².</p>
              </div>
            </Link>

            {/* 2: Готовые дома */}
            <Link href="/catalog/houses" className="group flex flex-col h-[400px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative border border-gray-100">
              <Image src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop" alt="Готовые дома" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C]/90 via-[#1B3A5C]/40 to-transparent"></div>
              <div className="relative mt-auto p-8 z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Готовые дома</h3>
                <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">Виллы и коттеджи под ключ с чистовой отделкой.</p>
              </div>
            </Link>

            {/* 3: Новостройки */}
            <Link href="/catalog/apartments" className="group flex flex-col h-[400px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative border border-gray-100">
              <Image src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop" alt="Новостройки" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C]/90 via-[#1B3A5C]/40 to-transparent"></div>
              <div className="relative mt-auto p-8 z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Новостройки</h3>
                <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">Квартиры и апартаменты для жизни и инвестиций.</p>
              </div>
            </Link>

            {/* 4: Участки */}
            <Link href="/catalog/plots" className="group flex flex-col h-[400px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative border border-gray-100">
              <Image src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop" alt="Участки" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A5C]/90 via-[#1B3A5C]/40 to-transparent"></div>
              <div className="relative mt-auto p-8 z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Земельные участки</h3>
                <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto">Идеальные локации под строительство вашего проекта.</p>
              </div>
            </Link>

          </div>
        </div>
      </section>
{/* НОВАЯ СЕКЦИЯ: ИНТЕРАКТИВНАЯ 3D-ПЕЧАТЬ */}
<section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Текстовая часть */}
            <div className="lg:w-1/3">
              <span className="text-[#2D7A4F] font-bold tracking-wider uppercase text-sm mb-2 block">Технологии будущего</span>
              <h2 className="text-4xl font-bold text-[#1B3A5C] mb-6">Ваш дом в 3D: от фундамента до крыши</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Мы используем инженерные форматы и 3D-печать (принтеры ATLANT). Покрутите модель справа, чтобы увидеть, как именно формируется проект дома "Капри" перед тем, как мы начнем возведение.
              </p>
            
            </div>

            {/* Контейнер для 3D */}
            <div className="lg:w-2/3 w-full h-[600px] shadow-2xl rounded-[40px] border-4 border-gray-50">
              <House3DViewer />
            </div>
          </div>
        </div>
      </section>
      {/* 3. ЭКСПЕРТИЗА ХОМСА (ПОЧЕМУ МЫ) */}
      <section className="py-24 bg-[#F5F5F0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-[#1B3A5C] mb-6">Метод дедукции <br/>на рынке недвижимости</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Подобно великому детективу, мы не полагаемся на поверхностные данные. Мы изучаем документы, анализируем локации, проверяем надежность технологий и находим для вас идеальные варианты, скрытые от глаз обывателя.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2D7A4F]/10 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-[#2D7A4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1B3A5C]">Юридическая чистота</h4>
                    <p className="text-gray-500">Доскональная проверка каждого объекта и застройщика.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2D7A4F]/10 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-[#2D7A4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1B3A5C]">Инновации 3D-печати</h4>
                    <p className="text-gray-500">Собственное производство и технологии возведения домов будущего.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl">
                 <Image src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" alt="Офис HOMESRF" width={800} height={600} className="object-cover w-full h-[500px]"/>
                 <div className="absolute inset-0 bg-[#1B3A5C]/20 mix-blend-multiply"></div>
              </div>
              {/* Бейдж */}
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl max-w-xs">
                <p className="text-[#1B3A5C] font-bold text-2xl mb-1"> 500</p>
                <p className="text-gray-500 text-sm">Проверенных объектов в закрытой базе Хомса</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}