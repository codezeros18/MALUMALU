// DOMAIN HARGA — layanan referensi harga harian lewat WhatsApp.
// Vocabulary sengaja dipadankan dengan app mobile (komoditas, wilayah, STDB+GPS)
// agar bot dan JejakHijau berbicara dalam konsep yang sama.

export type Komoditas = 'kopi' | 'sawit' | string;

/** Wilayah agregasi: kecamatan/kabupaten. Kunci teks bebas (Pangalengan, dll). */
export type Wilayah = string;

/** Grade/kualitas. Kosong ('') berarti agregat tanpa pemisahan grade. */
export type Grade = string;

export type PriceSourceKind = 'platform' | 'eksternal';

/**
 * Satu harga masukan. `platform` = deal terakhir dari agent/exporter yang
 * transaksi di platform. `eksternal` = harga acuan asosiasi/Bappebti / rata-rata
 * ekspor region (opsional, dipakai sebagai sumber sekunder).
 */
export interface PriceSource {
  id: string;
  kind: PriceSourceKind;
  komoditas: Komoditas;
  wilayah: Wilayah;
  grade: Grade;
  /** Harga per kg dalam Rupiah. */
  pricePerKg: number;
  /** Jumlah transaksi yang mendasari angka ini (1 untuk deal tunggal). */
  txnCount: number;
  /** Apakah transaksi terverifikasi (dari platform resmi / sumber terpercaya). */
  verified: boolean;
  /** ISO date sumber harga (digunakan untuk jendela harian). */
  date: string;
}

/**
 * Hasil agregasi harian untuk satu kombinasi komoditas x wilayah x grade.
 * `low`/`high` adalah rentang, `avg` rata-rata berbobot terhadap txnCount.
 */
export interface ReferencePrice {
  komoditas: Komoditas;
  wilayah: Wilayah;
  grade: Grade;
  low: number;
  high: number;
  avg: number;
  /** Jumlah transaksi terverifikasi dalam jendela agregasi. */
  txnCount: number;
  /** ISO date referensi (hari ini saat dihitung). */
  date: string;
}

/** Payload balasan bot sesuai format brief (📊 + rentang + nudge + link). */
export interface PriceReply {
  found: boolean;
  text: string;
}
