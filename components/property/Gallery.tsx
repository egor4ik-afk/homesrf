
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';

interface GalleryProps {
  images: string[];
}

export default function Gallery({ images }: GalleryProps) {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      className="w-full h-96"
    >
      {images.map((image, index) => (
        <SwiperSlide key={index}>
          <Image src={image} alt={`Property image ${index + 1}`} layout="fill" objectFit="cover" />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
