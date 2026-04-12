import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-cover bg-center h-96 text-white flex items-center justify-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop')" }}>
        <div className="text-center bg-black bg-opacity-50 p-8 rounded-lg">
          <h1 className="text-5xl font-bold mb-4">Найдите дом своей мечты</h1>
          <p className="text-xl mb-8">Мы поможем вам найти идеальную недвижимость</p>
          <Link href="/catalog/apartments" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Начать поиск
          </Link>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Рекомендуемые объекты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Property 1 */}
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop" alt="Property 1" width={500} height={300} />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">Современная квартира в центре</h3>
              <p className="text-gray-700">Цена: 10 000 000 руб.</p>
            </div>
          </div>
          {/* Property 2 */}
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" alt="Property 2" width={500} height={300} />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">Уютный загородный дом</h3>
              <p className="text-gray-700">Цена: 25 000 000 руб.</p>
            </div>
          </div>
          {/* Property 3 */}
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <Image src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop" alt="Property 3" width={500} height={300} />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">Дом с бассейном</h3>
              <p className="text-gray-700">Цена: 35 000 000 руб.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">О нас</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">Мы — команда профессионалов, которая поможет вам найти недвижимость вашей мечты. Мы предлагаем широкий выбор объектов и полное сопровождение сделки.</p>
        </div>
      </section>
    </div>
  );
}
