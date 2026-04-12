'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// Константы для фильтров
const DISTRICTS = ['Центральный', 'Адлер', 'Хоста', 'Лазаревский', 'Красная Поляна', 'Сириус', 'Имеретинская низменность'];
const TYPES = [
    { value: 'house', label: 'Дом' },
    { value: 'apartment', label: 'Квартира' },
    { value: 'plot', label: 'Участок' },
    { value: 'complex', label: 'Комплекс' },
];
const PRICES = [
    { value: 10_000_000, label: 'до 10 млн' },
    { value: 20_000_000, label: 'до 20 млн' },
    { value: 50_000_000, label: 'до 50 млн' },
    { value: 100_000_000, label: 'до 100 млн' },
];

export default function Filters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleFilterChange = useDebouncedCallback((name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        // Сбрасываем страницу на первую при изменении фильтров
        params.delete('page');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, 300); // Задержка в 300мс

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm mb-8 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Фильтр по типу */}
                <select
                    name="type"
                    defaultValue={searchParams.get('type') || ''}
                    onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Все типы</option>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                {/* Фильтр по району */}
                <select
                    name="district"
                    defaultValue={searchParams.get('district') || ''}
                    onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Все районы</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Фильтр по цене */}
                <select
                    name="price_max"
                    defaultValue={searchParams.get('price_max') || ''}
                    onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Любая цена</option>
                    {PRICES.map(p => <option key={p.value} value={p.value.toString()}>{p.label}</option>)}
                </select>
                 <button
                    onClick={() => {
                        startTransition(() => {
                            router.replace(pathname);
                        });
                    }}
                    className="p-2 border rounded-md bg-gray-200 hover:bg-gray-300 transition-colors col-span-1 sm:col-span-2 md:col-span-1"
                >
                    Сбросить
                </button>
            </div>
        </div>
    );
}
