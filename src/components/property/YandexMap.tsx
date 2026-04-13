
'use client';

import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

interface YandexMapProps {
  coordinates: [number, number];
}

export default function YandexMap({ coordinates }: YandexMapProps) {
  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
      <Map defaultState={{ center: coordinates, zoom: 15 }} width="100%" height="400px">
        <Placemark geometry={coordinates} />
      </Map>
    </YMaps>
  );
}
