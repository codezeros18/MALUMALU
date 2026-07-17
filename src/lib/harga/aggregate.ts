// AGREGASI HARGA REFERENSI (Sprint 20 — lihat docs/09_UPGRADE_BLUEPRINT.md §4.2).
// Prinsip: harga referensi = AGREGAT TRANSPARAN dari transaksi terverifikasi, BUKAN
// angka yang diset satu pihak (eksportir) — ini yang melindungi petani dari harga sepihak.
//
// Kenapa file terpisah dari mobile/src/lib/harga/aggregate.ts (bukan modul benar-benar
// shared): web (root) dan mobile/ adalah dua paket npm independen (masing-masing
// package.json/node_modules sendiri, tidak ada npm workspace yang menghubungkan
// keduanya) — membuat workspace monorepo sungguhan adalah perubahan infra besar &
// berisiko di luar cakupan fitur ini. Sesuai guardrail Sprint 20 ("ANGKAT jadi modul
// shared ATAU samakan rumusnya"), keputusan sadar: SAMAKAN RUMUSNYA. Prinsip matematis
// identik dengan mobile/src/lib/harga/aggregate.ts (audit Sprint 18 mengonfirmasi rumus
// itu SUDAH BENAR — rata-rata berbobot per jumlah transaksi, bukan bug) — di sana
// dihitung dari PriceSource[] yang SUDAH diagregasi per-sumber (tiap sumber punya
// txnCount sendiri), di sini dihitung langsung dari baris Transaksi individual (tiap
// baris = 1 transaksi nyata, bobot 1 masing-masing) — secara matematis kasus khusus
// rumus yang sama (bobot seragam per transaksi atomik).
import type { Transaksi } from '../../types';

export interface ReferencePrice {
  komoditas: string;
  wilayah: string;
  grade: string;
  avg: number;
  low: number;
  high: number;
  txnCount: number;
}

// Ambang "data belum cukup" — di bawah ini JANGAN tampilkan angka (bisa menyesatkan
// dari sampel terlalu kecil), tampilkan pesan eksplisit sebagai gantinya.
export const MIN_TXN_COUNT = 3;

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Hitung referensi harga dari transaksi individual yang cocok komoditas+wilayah+grade
 * dan `verified === true`. Mengembalikan null bila jumlah transaksi cocok < MIN_TXN_COUNT
 * (guard "data belum cukup" — TIDAK menampilkan angka dari sampel terlalu kecil).
 */
export function getReferencePrice(
  transaksi: Transaksi[],
  komoditas: string,
  wilayah: string,
  grade = '',
): ReferencePrice | null {
  const kom = normalize(komoditas);
  const wil = normalize(wilayah);
  const grd = normalize(grade);

  const matched = transaksi.filter(
    (t) =>
      t.verified &&
      normalize(t.komoditas) === kom &&
      normalize(t.wilayah) === wil &&
      normalize(t.grade) === grd,
  );

  if (matched.length < MIN_TXN_COUNT) return null;

  let sum = 0;
  let low = Infinity;
  let high = -Infinity;
  for (const t of matched) {
    sum += t.hargaPerKg;
    low = Math.min(low, t.hargaPerKg);
    high = Math.max(high, t.hargaPerKg);
  }

  return {
    komoditas,
    wilayah,
    grade,
    avg: Math.round(sum / matched.length),
    low,
    high,
    txnCount: matched.length,
  };
}
