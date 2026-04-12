'use client';

import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

export default function PropertyMap({ coordinates }: { coordinates: [number, number] }) {
  return (
    <YMaps>
      <Map defaultState={{ center: coordinates, zoom: 15 }} width="100%" height="400px">
        <Placemark geometry={coordinates} />
      </Map>
    </YMaps>
  );
}
