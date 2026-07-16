export interface RasterData {
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  width: number;
  height: number;
  values: number[]; // row-major, panjang = width*height (0=non-hutan, 1=hutan)
}

let rasterPromise: Promise<RasterData> | null = null;

export function loadRaster(): Promise<RasterData> {
  if (!rasterPromise) {
    rasterPromise = (async () => {
      try {
        const res = await fetch('/rasters/pangalengan.json');
        if (!res.ok) {
          throw new Error(`Gagal memuat raster: HTTP ${res.status}`);
        }
        return (await res.json()) as RasterData;
      } catch (err) {
        rasterPromise = null; // izinkan retry pada panggilan berikutnya
        console.error('[raster] loadRaster failed', err);
        throw new Error('Gagal memuat data raster deforestasi (pastikan sudah di-cache offline).');
      }
    })();
  }
  return rasterPromise;
}
