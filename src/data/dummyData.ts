// DATA DEMO — profil ilustratif berbasis karakter wilayah Pangalengan (kopi).
// BUKAN data pemasok nyata. Berlabel "DATA DEMO" di UI.
import { getPetani } from '../lib/db';
import { prosesPlotBaru, type PlotInput } from '../lib/prosesPlot';

const DEMO_PLOTS: PlotInput[] = [
  {
    // lengkap + sel aman → export_ready
    nama: 'Bu Sari Rahayu',
    desa: 'Margamukti',
    telepon: '0812-2000-1001',
    komoditas: 'kopi',
    lat: -7.15,
    lng: 107.62,
    gpsAccuracyM: 7,
  },
  {
    // tanpa telepon → lokal (data belum lengkap)
    nama: 'Pak Dedi Kurnia',
    desa: 'Pulosari',
    komoditas: 'kopi',
    lat: -7.16,
    lng: 107.6,
    gpsAccuracyM: 9,
  },
  {
    // sel timur-laut terindikasi deforestasi → lokal
    nama: 'Bu Rina Marlina',
    desa: 'Sukamanah',
    telepon: '0813-3000-2002',
    komoditas: 'kopi',
    lat: -7.07,
    lng: 107.69,
    gpsAccuracyM: 12,
  },
];

export async function seedDummyData(): Promise<number> {
  const existing = await getPetani();
  if (existing.length > 0) return 0;
  for (const input of DEMO_PLOTS) {
    await prosesPlotBaru(input);
  }
  return DEMO_PLOTS.length;
}
