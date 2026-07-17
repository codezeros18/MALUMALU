// DATA SUMBER HARGA (SAMPLE) — profil ilustratif Pangalengan & sekitarnya.
// BUKAN harga pasar nyata. Pengganti feed platform/eksternal sampai tersedia.
// Berlabel "DATA DEMO" di UI/bot bila perlu.
import type { PriceSource } from './types';

/**
 * Sumber harga contoh. Komoditas tunggal 'kopi' dengan dua wilayah agar
 * parser bot bisa dibedakan (Pangalengan vs wilayah lain). `date` memakai
 * tanggal tetap agar agregasi deterministik dalam test; di runtime pakai
 * tanggal hari ini (lihat aggregate.ts -> aggregateDaily).
 */
export const SAMPLE_PRICE_SOURCES: PriceSource[] = [
  // Pangalengan — kopi cherry, deal platform terverifikasi
  { id: 's1', kind: 'platform', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', pricePerKg: 58000, txnCount: 4, verified: true, date: '2026-07-17' },
  { id: 's2', kind: 'platform', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', pricePerKg: 61000, txnCount: 3, verified: true, date: '2026-07-17' },
  { id: 's3', kind: 'platform', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', pricePerKg: 64000, txnCount: 5, verified: true, date: '2026-07-17' },
  { id: 's4', kind: 'eksternal', komoditas: 'kopi', wilayah: 'Pangalengan', grade: '', pricePerKg: 62000, txnCount: 0, verified: true, date: '2026-07-17' },
  // Bandung — kopi cherry, lebih rendah
  { id: 's5', kind: 'platform', komoditas: 'kopi', wilayah: 'Bandung', grade: '', pricePerKg: 52000, txnCount: 2, verified: true, date: '2026-07-17' },
  { id: 's6', kind: 'platform', komoditas: 'kopi', wilayah: 'Bandung', grade: '', pricePerKg: 55000, txnCount: 3, verified: true, date: '2026-07-17' },
  // Pangalengan — sawit
  { id: 's7', kind: 'platform', komoditas: 'sawit', wilayah: 'Pangalengan', grade: '', pricePerKg: 2100, txnCount: 6, verified: true, date: '2026-07-17' },
];
