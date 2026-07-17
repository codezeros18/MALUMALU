// BRIDGE STATUS PASPOR — menghubungkan bot harga dengan data Paspor Petani.
// Di mobile app, ini membaca AsyncStorage (petani/plot/kartu). Di backend
// terpisah, ganti implementasi ini dengan panggilan ke datastore platform.
import { getKartus, getPetani, getPlots } from '../db';
import type { PasporStatus } from './bot';
import type { Petani, Plot } from '../../types';

function digits(t: string | undefined): string {
  return (t ?? '').replace(/\D/g, '');
}

/**
 * Lookup status Paspor berdasar nomor telepon petani.
 * Mengembalikan null bila nomor tak terdaftar. Komputasi ulang (STDB+GPS)
 * dari data terkini agar selaras dengan Kartu yang ditampilkan di app.
 */
export async function lookupPasporByPhone(telepon: string): Promise<PasporStatus | null> {
  const phone = digits(telepon);
  const [petanis, plots, kartus] = await Promise.all([getPetani(), getPlots(), getKartus()]);
  const petani: Petani | undefined = petanis.find(p => digits(p.telepon) === phone);
  if (!petani) return null;

  const plot: Plot | undefined = plots.find(p => p.petaniId === petani.id);
  const kartu = kartus
    .filter(k => k.petaniId === petani.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const stdbLengkap = Boolean(petani.nama && petani.desa && petani.telepon);
  const gpsOk = !plot || plot.gpsAccuracyM === undefined || plot.gpsAccuracyM <= 20;

  return {
    lengkap: stdbLengkap && gpsOk,
    tier: kartu?.tier ?? 'lokal',
  };
}

/**
 * Resolver untuk lapisan orkestrasi (penerima pesan WA masuk): mengambil
 * status Paspor secara async lalu meneruskannya ke bot murni. Bot sendiri
 * tetap sinkron & teruji; pemanggilan async ada di sini.
 */
export async function resolvePasporForBot(telepon: string): Promise<PasporStatus | null> {
  return lookupPasporByPhone(telepon);
}
