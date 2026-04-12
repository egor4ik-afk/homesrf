
'use client';

import { useState, useMemo } from 'react';
import LeadForm from '@/components/LeadForm'; // Предполагаем, что форма уже существует

// --- Данные для конструктора ---
const AREAS = [80, 100, 120, 150, 200, 250];
const FLOORS = [1, 2, 3];
const MATERIALS = [
  { name: 'Каркас', price: 35000 },
  { name: 'Газобетон', price: 45000 },
  { name: 'Брус', price: 55000 },
  { name: 'Кирпич', price: 65000 },
];
const ROOFS = ['Двускатная', 'Вальмовая', 'Плоская'];
const EXTRAS = [
  { name: 'Терраса', price: 300000 },
  { name: 'Гараж', price: 400000 },
  { name: 'Баня', price: 250000 },
  { name: 'Бассейн', price: 800000 },
];

// --- Компоненты для выбора опций ---
const OptionButton = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm md:text-base font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out transform hover:scale-105 ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
    {label}
  </button>
);

const CheckboxOption = ({ label, isChecked, onChange }: { label: string, isChecked: boolean, onChange: () => void }) => (
  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-50">
    <input type="checkbox" checked={isChecked} onChange={onChange} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
    <span className="text-gray-700 font-medium">{label}</span>
  </label>
);

// --- Основной компонент конструктора ---
export default function HouseConstructorPage() {
  const [area, setArea] = useState(AREAS[0]);
  const [floors, setFloors] = useState(FLOORS[0]);
  const [material, setMaterial] = useState(MATERIALS[0].name);
  const [roof, setRoof] = useState(ROOFS[0]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const handleExtraChange = (name: string) => {
    setSelectedExtras(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const totalPrice = useMemo(() => {
    const materialPrice = MATERIALS.find(m => m.name === material)?.price || 0;
    const basePrice = area * materialPrice;
    const extrasPrice = selectedExtras.reduce((sum, extraName) => {
      const extra = EXTRAS.find(e => e.name === extraName);
      return sum + (extra ? extra.price : 0);
    }, 0);
    return basePrice + extrasPrice;
  }, [area, material, selectedExtras]);

  const formattedPrice = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalPrice);

  const leadFormMessage = `Хочу построить дом ${area}м², материал - ${material}, ${floors} этажа. Ориентировочная стоимость: ${formattedPrice}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-2">Конструктор вашего будущего дома</h1>
        <p className="text-center text-gray-500 mb-8 md:mb-12">Рассчитайте стоимость и оставьте заявку за 30 секунд</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* -- Шаги -- */}
            <div className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. Выберите площадь</h2>
              <div className="flex flex-wrap gap-2">
                {AREAS.map(a => <OptionButton key={a} label={`${a} м²`} isSelected={area === a} onClick={() => setArea(a)} />)}
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. Укажите этажность</h2>
              <div className="flex flex-wrap gap-2">
                {FLOORS.map(f => <OptionButton key={f} label={`${f} этаж${f > 1 ? 'а' : ''}`} isSelected={floors === f} onClick={() => setFloors(f)} />)}
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. Выберите материал стен</h2>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map(m => <OptionButton key={m.name} label={m.name} isSelected={material === m.name} onClick={() => setMaterial(m.name)} />)}
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. Определите тип крыши</h2>
              <div className="flex flex-wrap gap-2">
                {ROOFS.map(r => <OptionButton key={r} label={r} isSelected={roof === r} onClick={() => setRoof(r)} />)}
              </div>
            </div>
            
            <div className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. Дополнительные опции</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {EXTRAS.map(e => <CheckboxOption key={e.name} label={`${e.name} (+${new Intl.NumberFormat('ru-RU').format(e.price)}₽)`} isChecked={selectedExtras.includes(e.name)} onChange={() => handleExtraChange(e.name)} />)}
              </div>
            </div>
          </div>

          {/* --- Сайдбар с итоговой ценой и формой --- */}
          <div className="lg:col-span-1 sticky top-8 h-fit">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ваш проект</h2>
              <div className="space-y-2 text-gray-600 mb-6">
                  <p><strong>Площадь:</strong> {area} м²</p>
                  <p><strong>Этажность:</strong> {floors}</p>
                  <p><strong>Материал:</strong> {material}</p>
                  <p><strong>Крыша:</strong> {roof}</p>
                  {selectedExtras.length > 0 && <p><strong>Допы:</strong> {selectedExtras.join(', ')}</p>}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center mb-6">
                <p className="text-sm font-semibold text-blue-800">Ориентировочная стоимость</p>
                <p className="text-3xl font-extrabold text-blue-900 transition-all duration-300">{formattedPrice}</p>
              </div>
              <LeadForm prefilledMessage={leadFormMessage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
