import { addPetani, addPlot, listPetani } from '../lib/db';
import { getItem, setItem } from '../lib/storage';
import type { Plot } from '../types';

export const DEMO_LABEL = 'DATA DEMO';

const DEMO_PLOT_IDS_KEY = 'demo-plot-ids';

interface DummyPetaniSeed {
  nama: string;
  desa: string;
  telepon: string;
  lat: number;
  lng: number;
  gpsAccuracyM: number;
}

// DATA ILUSTRATIF UNTUK DEMO — bukan data pemasok/petani nyata (lihat disclosure di UI).
// Koordinat sengaja dipilih di dalam bbox raster demo Pangalengan (lihat
// scripts/preprocess-raster.md) supaya mencakup contoh status "aman" DAN "perlu-audit".
const DUMMY_PETANI: DummyPetaniSeed[] = [
  {
    nama: 'Bu Ani (Demo)',
    desa: 'Pangalengan',
    telepon: '0812-0000-0001',
    lat: -7.1055,
    lng: 107.55825, // non-hutan -> aman
    gpsAccuracyM: 6,
  },
  {
    nama: 'Pak Ujang (Demo)',
    desa: 'Pulosari',
    telepon: '0812-0000-0002',
    lat: -7.1755,
    lng: 107.61825, // di dalam kantong hutan tiruan -> perlu-audit
    gpsAccuracyM: 9,
  },
  {
    nama: 'Pak Dedi (Demo)',
    desa: 'Warnasari',
    telepon: '0812-0000-0003',
    lat: -7.19,
    lng: 107.685, // non-hutan -> aman
    gpsAccuracyM: 5,
  },
];

export interface SeedResult {
  seeded: boolean;
  plots: Plot[];
}

// Mengisi DB dengan data demo HANYA bila kosong (tidak menimpa data asli yang sudah ada).
// Dipanggil manual lewat tombol "Muat data demo" — tidak pernah otomatis.
export async function seedDummyData(): Promise<SeedResult> {
  const existing = await listPetani();
  if (existing.length > 0) {
    return { seeded: false, plots: [] };
  }

  const createdPlots: Plot[] = [];
  for (const seed of DUMMY_PETANI) {
    const petani = await addPetani({ nama: seed.nama, desa: seed.desa, telepon: seed.telepon });
    const plot = await addPlot({
      petaniId: petani.id,
      lat: seed.lat,
      lng: seed.lng,
      komoditas: 'kopi',
      gpsAccuracyM: seed.gpsAccuracyM,
      capturedAt: Date.now(),
    });
    createdPlots.push(plot);
  }

  setItem(
    DEMO_PLOT_IDS_KEY,
    createdPlots.map((p) => p.id),
  );
  return { seeded: true, plots: createdPlots };
}

export function isDemoPlot(plotId: string): boolean {
  const ids = getItem<string[]>(DEMO_PLOT_IDS_KEY) ?? [];
  return ids.includes(plotId);
}
