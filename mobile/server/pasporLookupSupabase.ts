// LOOKUP STATUS PASPOR VIA SUPABASE — pengganti mobile/src/lib/harga/pasporLookup.ts
// (yang baca AsyncStorage) KHUSUS untuk konteks mobile/server/ (proses Node standalone,
// tidak bisa menjangkau AsyncStorage milik app Expo — lihat catatan di file itu).
// Logika kelengkapan (stdbLengkap/gpsOk) SENGAJA disamakan persis dengan versi
// AsyncStorage supaya definisi "Paspor lengkap" konsisten di kedua tempat.
import { fetchSupabaseTable } from './supabaseRest';
import type { PasporStatus } from '../src/lib/harga/bot';

interface PetaniRow {
  id: string;
  nama: string | null;
  desa: string | null;
  telepon: string | null;
}

interface PlotRow {
  id: string;
  petani_id: string;
  gps_accuracy_m: number | null;
}

interface KartuRow {
  id: string;
  petani_id: string;
  tier: 'lokal' | 'export-ready';
  created_at: number;
}

function digits(t: string | null | undefined): string {
  return (t ?? '').replace(/\D/g, '');
}

/**
 * Cari status Paspor berdasar nomor telepon petani, baca langsung dari tabel Supabase
 * (petani/plot/kartu — sama seperti yang dipakai web). Mengembalikan null bila nomor
 * tidak terdaftar sama sekali.
 */
export async function lookupPasporByPhoneSupabase(telepon: string): Promise<PasporStatus | null> {
  const phone = digits(telepon);
  if (!phone) return null;

  const petanis = await fetchSupabaseTable<PetaniRow>('petani', '?select=id,nama,desa,telepon');
  const petani = petanis.find((p) => digits(p.telepon) === phone);
  if (!petani) return null;

  const [plots, kartus] = await Promise.all([
    fetchSupabaseTable<PlotRow>('plot', `?select=id,petani_id,gps_accuracy_m&petani_id=eq.${petani.id}`),
    fetchSupabaseTable<KartuRow>('kartu', `?select=id,petani_id,tier,created_at&petani_id=eq.${petani.id}`),
  ]);

  const plot = plots[0];
  const kartu = kartus.slice().sort((a, b) => b.created_at - a.created_at)[0];

  const stdbLengkap = Boolean(petani.nama && petani.desa && petani.telepon);
  const gpsOk = !plot || plot.gps_accuracy_m == null || plot.gps_accuracy_m <= 20;

  return {
    lengkap: stdbLengkap && gpsOk,
    // Web pakai 'export-ready' (strip), mobile PasporStatus pakai 'export_ready'
    // (underscore, lihat bot.ts) — dipetakan di sini, satu-satunya titik konversi.
    tier: kartu?.tier === 'export-ready' ? 'export_ready' : 'lokal',
  };
}
