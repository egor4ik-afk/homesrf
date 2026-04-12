'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import Image from 'next/image';

export default function ImageGallery({ images }: { images: { url: string }[] }) {
  return (
    <Swiper
      modules={[Pagination]}
      pagination={{ clickable: true }}
      className="w-full h-96"
    >
      {images.map((image, index) => (
        <SwiperSlide key={index}>
          <Image
            src={image.url}
            alt={`Property image ${index + 1}`}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
