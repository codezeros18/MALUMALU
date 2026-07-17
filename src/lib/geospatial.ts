import { booleanPointInPolygon, polygon as turfPolygon } from '@turf/turf';
import type { DeforestasiCheck, DeforestasiStatus } from '../types';
import { loadRaster, type RasterData } from './raster';
import { computeAreaHa, type LatLng } from './polygon';

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

// ===== SKOR RISIKO POLIGON (Sprint 19 — additif, lihat docs/09_UPGRADE_BLUEPRINT.md §4.1)
// TIDAK mengubah cekDeforestasi()/pointToPixel()/getRasterValue() di atas (point-in-raster
// existing, dipakai alur Agen sejak Sprint 4) maupun ruleEngine.ts — ini sinyal TAMBAHAN
// yang ditampilkan berdampingan untuk batas kebun berbentuk poligon (Sprint 16.5/17-ish),
// bukan pengganti. REUSE penuh lib/raster.ts (loader yang sama) — tidak ada loader kedua.

export type PolygonRiskLevel = 'rendah' | 'sedang' | 'tinggi';

export interface PolygonRiskResult {
  luasHa: number;
  forestOverlapPct: number; // 0-100, % sel raster "hutan" di dalam poligon
  risk: PolygonRiskLevel;
  cellsInside: number; // total sel raster yang pusatnya jatuh di dalam poligon
  forestCellsInside: number;
  catatanError: string;
}

// Ambang dikonstantakan (bukan hardcode berulang) — boleh disetel tanpa mengubah alur
// pemanggilan. <10% dianggap rendah, >40% tinggi, di antaranya sedang (perlu-audit).
const RISK_LOW_MAX_PCT = 10;
const RISK_MEDIUM_MAX_PCT = 40;

function toClosedLngLatRing(points: LatLng[]): number[][] {
  const ring = points.map((p) => [p.lng, p.lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
  return ring;
}

/**
 * Skor risiko deforestasi untuk batas kebun berbentuk poligon (bukan titik tunggal).
 * Sampling: tiap sel grid raster JRC yang PUSATNYA jatuh di dalam poligon dihitung; risiko =
 * proporsi sel "hutan" (nilai 1) dari total sel yang tersampel. Poligon di luar bbox raster
 * (cellsInside = 0) TIDAK diklaim aman — jatuh ke 'sedang' (perlu-audit), sama seperti
 * cekDeforestasi() memperlakukan titik di luar bbox/tanpa data.
 *
 * Deterministik & pure (raster di-load lewat lib/raster.ts yang sudah ada, tidak ada state
 * lain). Poligon < 3 titik tidak valid -> null (biarkan pemanggil putuskan pesan errornya).
 */
export async function getPolygonRisk(points: LatLng[]): Promise<PolygonRiskResult | null> {
  if (points.length < 3) return null;

  const raster = await loadRaster();
  const luasHa = computeAreaHa(points);
  const poly = turfPolygon([toClosedLngLatRing(points)]);

  const [minLng, minLat, maxLng, maxLat] = raster.bbox;
  const cellWidth = (maxLng - minLng) / raster.width;
  const cellHeight = (maxLat - minLat) / raster.height;

  let cellsInside = 0;
  let forestCellsInside = 0;

  for (let row = 0; row < raster.height; row++) {
    // row 0 = maxLat (baris paling utara) — konvensi sama seperti pointToPixel() di atas.
    const cellLat = maxLat - (row + 0.5) * cellHeight;
    for (let col = 0; col < raster.width; col++) {
      const cellLng = minLng + (col + 0.5) * cellWidth;
      if (!booleanPointInPolygon([cellLng, cellLat], poly)) continue;
      cellsInside++;
      if (raster.values[row * raster.width + col] === 1) forestCellsInside++;
    }
  }

  const forestOverlapPct = cellsInside > 0 ? (forestCellsInside / cellsInside) * 100 : 0;
  let risk: PolygonRiskLevel;
  if (cellsInside === 0) {
    risk = 'sedang'; // di luar bbox/tak ada data tersampel -> jangan klaim aman
  } else if (forestOverlapPct < RISK_LOW_MAX_PCT) {
    risk = 'rendah';
  } else if (forestOverlapPct <= RISK_MEDIUM_MAX_PCT) {
    risk = 'sedang';
  } else {
    risk = 'tinggi';
  }

  return {
    luasHa,
    forestOverlapPct,
    risk,
    cellsInside,
    forestCellsInside,
    catatanError: CATATAN_ERROR,
  };
}
