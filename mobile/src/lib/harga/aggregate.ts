// AGREGASI HARGA — hitung referensi harian per komoditas x wilayah x grade.
// Fungsi murni (tanpa I/O) agar dapat diuji deterministik.
import type { Komoditas, PriceSource, ReferencePrice, Wilayah, Grade } from './types';

/** Tanggal hari ini sebagai YYYY-MM-DD (dipisah agar test bisa menyuntikkan). */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Normalisasi teks wilayah/komoditas untuk pencocokan longgar. */
export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Saring sumber ke dalam jendela harian dan hanya yang terverifikasi.
 * `windowDays` memperbolehkan agregat mingguan (brief: "transaksi terverifikasi
 * minggu ini"). Default 7 hari.
 */
export function filterSources(
  sources: PriceSource[],
  komoditas: Komoditas,
  wilayah: Wilayah,
  today: string,
  windowDays = 7,
): PriceSource[] {
  const kom = normalize(String(komoditas));
  const wil = normalize(String(wilayah));
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  const windowStart = todayTime - (windowDays - 1) * 86400000;

  return sources.filter(s => {
    if (normalize(s.komoditas) !== kom) return false;
    if (normalize(s.wilayah) !== wil) return false;
    if (!s.verified) return false;
    const t = Date.parse(`${s.date}T00:00:00Z`);
    return t >= windowStart && t <= todayTime;
  });
}

/**
 * Agregasi berbobot: avg = Σ(price·txnCount)/Σ(txnCount). low/high dari
 * min/max harga sumber (hanya yang punya txnCount > 0). txnCount hasil adalah
 * total transaksi terverifikasi (sumber eksternal tanpa txn dihitung 0).
 */
export function aggregateDaily(
  sources: PriceSource[],
  komoditas: Komoditas,
  wilayah: Wilayah,
  grade: Grade = '',
  today: string = todayIso(),
): ReferencePrice | null {
  const kom = normalize(String(komoditas));
  const wil = normalize(String(wilayah));
  const matched = sources.filter(
    s => normalize(s.komoditas) === kom && normalize(s.wilayah) === wil && normalize(s.grade) === normalize(grade),
  );
  if (matched.length === 0) return null;

  const priced = matched.filter(s => s.txnCount > 0);
  if (priced.length === 0) {
    // Hanya sumber eksternal tanpa transaksi -> tidak cukup bukti.
    return null;
  }

  let weightSum = 0;
  let weighted = 0;
  let low = Infinity;
  let high = -Infinity;
  let txnCount = 0;

  for (const s of priced) {
    weightSum += s.txnCount;
    weighted += s.pricePerKg * s.txnCount;
    low = Math.min(low, s.pricePerKg);
    high = Math.max(high, s.pricePerKg);
    txnCount += s.txnCount;
  }

  const avg = Math.round(weighted / weightSum);
  return {
    komoditas,
    wilayah,
    grade,
    low,
    high,
    avg,
    txnCount,
    date: today,
  };
}

/**
 * Cari referensi untuk komoditas+wilayah (semua grade digabung ke '' bila tak
 * ada pemisahan). Mengembalikan null bila tak ada data terverifikasi.
 */
export function getReferencePrice(
  sources: PriceSource[],
  komoditas: Komoditas,
  wilayah: Wilayah,
  today: string = todayIso(),
): ReferencePrice | null {
  const filtered = filterSources(sources, komoditas, wilayah, today);
  if (filtered.length === 0) return null;
  return aggregateDaily(filtered, komoditas, wilayah, '', today);
}
