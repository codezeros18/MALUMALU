// Proyeksi Web Mercator sferis (EPSG:3857) yang sama dipakai OSM/Leaflet/MapLibre —
// dipakai untuk menghitung lat/lng dari posisi klik saat mode offline (peta 3D
// MapLibre tidak bisa dimuat tanpa internet), supaya "tap koordinat tetap berfungsi"
// tetap akurat walau basemap tidak tampil.

const TILE_SIZE = 256;

function worldSize(zoom: number): number {
  return TILE_SIZE * 2 ** zoom;
}

function lngLatToWorldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = worldSize(zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldPixelToLngLat(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const scale = worldSize(zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

/** Konversi offset piksel dari titik tengah layar (dx kanan, dy bawah) menjadi lat/lng. */
export function pixelOffsetToLatLng(
  centerLat: number,
  centerLng: number,
  zoom: number,
  dx: number,
  dy: number,
): { lat: number; lng: number } {
  const center = lngLatToWorldPixel(centerLat, centerLng, zoom);
  return worldPixelToLngLat(center.x + dx, center.y + dy, zoom);
}
