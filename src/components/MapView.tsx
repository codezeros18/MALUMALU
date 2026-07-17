import Map3D, { type Map3DMarker, type Map3DPolygon } from './Map3D';
import type { Plot } from '../types';

const PANGALENGAN_CENTER = { lat: -7.15, lng: 107.62 };
const DEFAULT_ZOOM = 12;

interface MapViewProps {
  plots: Plot[];
  onPickLocation: (lat: number, lng: number) => void;
  pickedPosition?: { lat: number; lng: number } | null;
  // Titik-titik poligon yang sedang direkam (mode gambar batas kebun) — kalau diisi,
  // ditampilkan sebagai marker bernomor + garis/isi poligon berjalan, MENGGANTIKAN
  // marker titik-tunggal pickedPosition (dua mode ini saling eksklusif per desain).
  drawingPoints?: { lat: number; lng: number }[];
  className?: string;
}

export default function MapView({
  plots,
  onPickLocation,
  pickedPosition,
  drawingPoints,
  className,
}: MapViewProps) {
  const markers: Map3DMarker[] = plots.map((plot) => ({
    id: plot.id,
    lat: plot.lat,
    lng: plot.lng,
    color: '#1F5C3A',
    label: `${plot.komoditas}${plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}`,
  }));

  const polygons: Map3DPolygon[] = plots
    .filter((plot) => plot.boundary && plot.boundary.length >= 3)
    .map((plot) => ({ id: plot.id, points: plot.boundary!, color: '#1F5C3A' }));

  if (drawingPoints && drawingPoints.length > 0) {
    drawingPoints.forEach((pt, i) => {
      markers.push({
        id: `__drawing_${i}__`,
        lat: pt.lat,
        lng: pt.lng,
        color: '#EA580C',
        label: `Titik ${i + 1}`,
      });
    });
    if (drawingPoints.length >= 3) {
      polygons.push({ id: '__drawing__', points: drawingPoints, color: '#EA580C' });
    }
  } else if (pickedPosition) {
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
      polygons={polygons}
      onPick={onPickLocation}
      className={className}
    />
  );
}
