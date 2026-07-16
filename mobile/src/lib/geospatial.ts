import raster from '../data/pangalengan.json';
import type { DeforestasiCheck } from '../types';

export const DISCLOSURE =
  'Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). ' +
  'Titik lokasi point-primary (GPS di bawah kanopi meleset 3–11 m). ' +
  'Rantai verifikasi = hash-chain (bukan blockchain). Data demo berlabel.';

export function cekDeforestasi(lat: number, lng: number): DeforestasiCheck {
  const { bbox, rows, cols, cells, source } = raster;
  if (lat < bbox.latMin || lat > bbox.latMax || lng < bbox.lngMin || lng > bbox.lngMax) {
    return { status: 'di_luar_area', cellValue: null, source, catatan: DISCLOSURE };
  }
  const row = Math.min(
    rows - 1,
    Math.max(0, Math.floor(((bbox.latMax - lat) / (bbox.latMax - bbox.latMin)) * rows)),
  );
  const col = Math.min(
    cols - 1,
    Math.max(0, Math.floor(((lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin)) * cols)),
  );
  const value = cells[row][col];
  return {
    status: value === 1 ? 'terindikasi' : 'aman',
    cellValue: value,
    source,
    catatan: DISCLOSURE,
  };
}
