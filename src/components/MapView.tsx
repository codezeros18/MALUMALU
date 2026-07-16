import Map3D, { type Map3DMarker } from './Map3D';
import type { Plot } from '../types';

const PANGALENGAN_CENTER = { lat: -7.15, lng: 107.62 };
const DEFAULT_ZOOM = 13;

interface MapViewProps {
  plots: Plot[];
  onPickLocation: (lat: number, lng: number) => void;
  pickedPosition?: { lat: number; lng: number } | null;
}

export default function MapView({ plots, onPickLocation, pickedPosition }: MapViewProps) {
  const markers: Map3DMarker[] = plots.map((plot) => ({
    id: plot.id,
    lat: plot.lat,
    lng: plot.lng,
    color: '#1F5C3A',
    label: `${plot.komoditas}${plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}`,
  }));

  if (pickedPosition) {
    markers.push({
      id: '__picked__',
      lat: pickedPosition.lat,
      lng: pickedPosition.lng,
      color: '#EA580C',
      label: 'Titik terpilih',
    });
  }

  return (
    <Map3D
      center={PANGALENGAN_CENTER}
      zoom={DEFAULT_ZOOM}
      markers={markers}
      onPick={onPickLocation}
    />
  );
}
