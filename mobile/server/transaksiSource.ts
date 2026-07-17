// JEMBATAN TRANSAKSI (Sprint 20, web) -> PriceSource (mobile/src/lib/harga, Sprint 22).
// Tabel `transaksi` di Supabase (dibangun Sprint 20 — lihat docs/06_PROGRESS_LOG.md)
// berisi baris transaksi INDIVIDUAL (satu baris = satu transaksi nyata). aggregateDaily/
// getReferencePrice di mobile/ (rumus sudah benar, dikonfirmasi Audit Sprint 18) dibangun
// di atas PriceSource[] yang sudah beragregasi-per-sumber. Pemetaan di sini: tiap baris
// transaksi individual = satu PriceSource dengan txnCount 1 (bobot seragam per transaksi
// atomik) — SATU prinsip matematis yang sama, bukan rumus kedua, persis catatan yang
// sama di src/lib/harga/aggregate.ts (web).
import { fetchSupabaseTable } from './supabaseRest';
import type { PriceSource } from '../src/lib/harga/types';

interface TransaksiRow {
  id: string;
  komoditas: string;
  wilayah: string;
  grade: string;
  harga_per_kg: number;
  tanggal: string;
  verified: boolean;
}

// Pure & testable — tidak menyentuh jaringan sama sekali.
export function mapTransaksiToPriceSources(rows: TransaksiRow[]): PriceSource[] {
  return rows.map((r) => ({
    id: r.id,
    kind: 'platform',
    komoditas: r.komoditas,
    wilayah: r.wilayah,
    grade: r.grade,
    pricePerKg: r.harga_per_kg,
    txnCount: 1,
    verified: r.verified,
    date: r.tanggal,
  }));
}

export async function fetchTransaksiPriceSources(): Promise<PriceSource[]> {
  const rows = await fetchSupabaseTable<TransaksiRow>(
    'transaksi',
    '?select=id,komoditas,wilayah,grade,harga_per_kg,tanggal,verified',
  );
  return mapTransaksiToPriceSources(rows);
}
