import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link href="/" className="font-bold text-xl">Real Estate</Link>
        <nav>
          <Link href="/catalog/apartments" className="p-2">Квартиры</Link>
          <Link href="/catalog/houses" className="p-2">Дома</Link>
          <Link href="/developers" className="p-2">Застройщики</Link>
          <Link href="/constructor" className="p-2">Конструктор</Link>
          <Link href="/blog" className="p-2">Блог</Link>
          <Link href="/map" className="p-2">Карта</Link>
        </nav>
      </div>
    </header>
  );
}