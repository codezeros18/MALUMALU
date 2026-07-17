import { area as turfArea, centroid as turfCentroid, polygon as turfPolygon } from '@turf/turf';

export interface LatLng {
  lat: number;
  lng: number;
}

export const MIN_POLYGON_POINTS = 3;

// turf butuh ring GeoJSON tertutup (titik pertama === titik terakhir) dan urutan
// [lng, lat] (bukan [lat, lng]) — helper ini menyembunyikan detail itu dari pemanggil.
function toClosedRing(points: LatLng[]): number[][] {
  const ring = points.map((p) => [p.lng, p.lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
  return ring;
}

export function computeCentroid(points: LatLng[]): LatLng {
  if (points.length === 1) return points[0];
  if (points.length === 2) {
    return { lat: (points[0].lat + points[1].lat) / 2, lng: (points[0].lng + points[1].lng) / 2 };
  }
  const poly = turfPolygon([toClosedRing(points)]);
  const [lng, lat] = turfCentroid(poly).geometry.coordinates;
  return { lat, lng };
}

// Luas dalam hektar (1 ha = 10.000 m²) — turf area() mengembalikan m².
export function computeAreaHa(points: LatLng[]): number {
  if (points.length < MIN_POLYGON_POINTS) return 0;
  const poly = turfPolygon([toClosedRing(points)]);
  return turfArea(poly) / 10000;
}
