import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';

// Используем memo для предотвращения лишних ре-рендеров, если пропсы не изменились
const PropertyCard = memo(({ property }) => {
    const { slug, title, price, area, address, images } = property;

    const formattedPrice = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
    }).format(price);

    const placeholderImage = 'https://storage.yandexcloud.net/homesrf/placeholder.svg';
    const imageUrl = images?.[0]?.url || placeholderImage;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Link href={`/property/${slug}`} className="block">
                <div className="relative h-56 w-full">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority // Приоритизируем загрузку первого изображения на странице
                    />
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{address}</p>
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-xl font-semibold text-blue-600">{formattedPrice}</p>
                        <p className="text-md text-gray-700">{area} м²</p>
                    </div>
                </div>
            </Link>
        </div>
    );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
