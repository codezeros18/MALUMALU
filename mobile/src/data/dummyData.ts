// DATA DEMO — profil ilustratif berbasis karakter wilayah Pangalengan (kopi).
// BUKAN data pemasok nyata. Berlabel "DATA DEMO" di UI.
//
// Setiap entry punya field risk + label `risky` (BUATAN, transparan) buat
// melatih RiskModel. Ini demonstrasi, bukan data operasional brako.
import { getPetani } from '../lib/db';
import { prosesPlotBaru, type PlotInput } from '../lib/prosesPlot';
import type { SupplierSample } from '../lib/riskModel';

const DEMO_PLOTS: (PlotInput & { risky: boolean })[] = [
  // --- aman (low) ---
  { nama: 'Bu Sari Rahayu', desa: 'Margamukti', telepon: '0812-2000-1001', komoditas: 'kopi', lat: -7.15, lng: 107.62, gpsAccuracyM: 7, luasHa: 0.5, volumeKg: 300, risky: false },
  { nama: 'Pak Slamet', desa: 'Pulosari', telepon: '0812-2000-1002', komoditas: 'kopi', lat: -7.16, lng: 107.6, gpsAccuracyM: 9, luasHa: 0.4, volumeKg: 240, risky: false },
  { nama: 'Bu Ani', desa: 'Sukamanah', telepon: '0812-2000-1003', komoditas: 'kopi', lat: -7.13, lng: 107.58, gpsAccuracyM: 11, luasHa: 0.6, volumeKg: 380, risky: false },
  { nama: 'Pak Joko', desa: 'Margamukti', telepon: '0812-2000-1004', komoditas: 'kopi', lat: -7.14, lng: 107.64, gpsAccuracyM: 8, luasHa: 0.45, volumeKg: 280, risky: false },
  { nama: 'Bu Tini', desa: 'Pulosari', telepon: '0812-2000-1005', komoditas: 'kopi', lat: -7.17, lng: 107.61, gpsAccuracyM: 10, luasHa: 0.55, volumeKg: 330, risky: false },
  { nama: 'Pak Wahyu', desa: 'Sukamanah', telepon: '0812-2000-1006', komoditas: 'kopi', lat: -7.12, lng: 107.59, gpsAccuracyM: 6, luasHa: 0.5, volumeKg: 310, risky: false },

  // --- risky (high/medium) ---
  { nama: 'Pak Dedi Kurnia', desa: 'Pulosari', komoditas: 'kopi', lat: -7.16, lng: 107.6, gpsAccuracyM: 9, stdbExpired: true, luasHa: 0.5, volumeKg: 320, risky: true },
  { nama: 'Bu Rina Marlina', desa: 'Sukamanah', telepon: '0813-3000-2002', komoditas: 'kopi', lat: -7.07, lng: 107.69, gpsAccuracyM: 12, luasHa: 0.5, volumeKg: 310, risky: true },
  { nama: 'Pak Bodong', desa: 'Margamukti', telepon: '0812-2000-1008', komoditas: 'kopi', lat: -7.15, lng: 107.63, gpsAccuracyM: 26, duplicateId: true, luasHa: 0.5, volumeKg: 300, risky: true },
  { nama: 'Bu Yati', desa: 'Pulosari', telepon: '0812-2000-1009', komoditas: 'kopi', lat: -7.18, lng: 107.62, gpsAccuracyM: 15, stdbExpired: true, luasHa: 0.4, volumeKg: 250, risky: true },
  { nama: 'Pak Sardi', desa: 'Sukamanah', telepon: '0812-2000-1010', komoditas: 'kopi', lat: -7.11, lng: 107.57, gpsAccuracyM: 18, luasHa: 0.5, volumeKg: 900, risky: true }, // over-volume
  { nama: 'Bu Suminah', desa: 'Margamukti', telepon: '0812-2000-1011', komoditas: 'kopi', lat: -7.14, lng: 107.65, gpsAccuracyM: 23, duplicateId: true, stdbExpired: true, luasHa: 0.5, volumeKg: 340, risky: true },
];

export const DEMO_RISK_SAMPLES: SupplierSample[] = DEMO_PLOTS.map(p => ({
  petani: { id: 'demo', nama: p.nama, desa: p.desa, telepon: p.telepon, stdbExpired: p.stdbExpired, duplicateId: p.duplicateId, createdAt: '' },
  plot: { id: 'demo', petaniId: 'demo', lat: p.lat, lng: p.lng, komoditas: p.komoditas, gpsAccuracyM: p.gpsAccuracyM, luasHa: p.luasHa, volumeKg: p.volumeKg, capturedAt: '' },
  risky: p.risky,
}));

export async function seedDummyData(): Promise<number> {
  const existing = await getPetani();
  if (existing.length > 0) return 0;
  for (const input of DEMO_PLOTS) {
    await prosesPlotBaru(input);
  }
  return DEMO_PLOTS.length;
}
