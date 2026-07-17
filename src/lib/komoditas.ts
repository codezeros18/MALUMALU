// Daftar komoditas pertanian/perkebunan Indonesia yang umum — dipakai bersama oleh
// PlotForm.tsx (komoditas kebun) dan form Rekam Transaksi (Sprint 20), supaya taksonomi
// komoditas tetap satu sumber, tidak dua daftar yang bisa saling drift. "kopi" default &
// urutan pertama karena fokus utama produk (integrasi notifikasi WhatsApp tim lain juga
// berpusat ke kopi). "Lainnya" jadi jalan keluar untuk komoditas di luar daftar.
export const KOMODITAS_OPTIONS = [
  'kopi',
  'kakao',
  'kelapa sawit',
  'kelapa',
  'karet',
  'teh',
  'tebu',
  'cengkeh',
  'lada',
  'pala',
  'vanili',
  'kayu manis',
  'padi',
  'jagung',
  'kedelai',
  'singkong',
  'ubi jalar',
  'kentang',
  'cabai',
  'bawang merah',
  'bawang putih',
  'tomat',
  'kacang tanah',
  'pisang',
  'mangga',
  'durian',
  'alpukat',
  'manggis',
  'rambutan',
  'nanas',
  'jeruk',
  'tembakau',
  'kapas',
  'sagu',
];

export const KOMODITAS_LAINNYA = '__lainnya__';
