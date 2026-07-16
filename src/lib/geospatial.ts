import type { DeforestasiCheck, DeforestasiStatus } from '../types';
import { loadRaster, type RasterData } from './raster';

const CATATAN_ERROR =
  "Peta JRC ~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). " +
  "Perlu audit manual bila 'perlu-audit'.";

export interface PixelCoord {
  col: number;
  row: number;
}

export function pointToPixel(lat: number, lng: number, raster: RasterData): PixelCoord | null {
  const [minLng, minLat, maxLng, maxLat] = raster.bbox;
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) {
    return null;
  }
  const col = Math.min(
    raster.width - 1,
    Math.floor(((lng - minLng) / (maxLng - minLng)) * raster.width),
  );
  const row = Math.min(
    raster.height - 1,
    Math.floor(((maxLat - lat) / (maxLat - minLat)) * raster.height),
  );
  return { col, row };
}

export function getRasterValue(lat: number, lng: number, raster: RasterData): number | null {
  const pixel = pointToPixel(lat, lng, raster);
  if (!pixel) return null;
  const index = pixel.row * raster.width + pixel.col;
  return raster.values[index] ?? null;
}

/**
 * Cek status deforestasi untuk satu titik (point-in-raster).
 * plotId opsional — isi dengan Plot.id (Sprint 4) supaya DeforestasiCheck.plotId terisi benar;
 * default string kosong bila dipanggil tanpa konteks plot (mis. untuk uji cepat).
 */
export async function cekDeforestasi(
  lat: number,
  lng: number,
  plotId = '',
): Promise<DeforestasiCheck> {
  const raster = await loadRaster();
  const value = getRasterValue(lat, lng, raster);

  let status: DeforestasiStatus;
  if (value === null) {
    status = 'perlu-audit'; // di luar bbox / tidak ada data -> jangan klaim aman
  } else if (value === 1) {
    status = 'perlu-audit'; // hutan menurut raster, tapi commission error 18% -> audit, bukan tolak
  } else {
    status = 'aman';
  }

  return {
    plotId,
    status,
    rasterValue: value ?? -1,
    catatanError: CATATAN_ERROR,
    checkedAt: Date.now(),
  };
}
