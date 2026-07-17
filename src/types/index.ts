// Kontrak tipe antar-modul (FS <-> AI). Lihat docs/02_TECH_ARCHITECTURE.md — jarang berubah.

// ===== SYNC (fase full-production, lihat docs/04_FULL_PRODUCTION_BLUEPRINT.md §1) =====
// Field sync di bawah ini opsional (`?`) supaya data lama di IndexedDB dari fase MVP
// tetap valid tanpa migrasi paksa.

export type SyncStatus = 'local' | 'synced' | 'conflict';

interface Syncable {
  syncStatus?: SyncStatus;
  remoteId?: string;
  updatedAt?: number;
  agentId?: string; // device/agen mana yang input — dipakai atribusi dashboard Eksportir
}

// ===== ENTITAS INTI =====

export interface Petani extends Syncable {
  id: string;
  nama: string;
  nikHash?: string; // NIK di-hash (jangan simpan plaintext)
  telepon?: string;
  desa?: string;
  email?: string; // untuk akses Petani Portal (Sprint 14)
  createdAt: number;
}

export interface Plot extends Syncable {
  id: string;
  petaniId: string;
  lat: number; // titik representatif — centroid poligon kalau boundary ada, atau titik tunggal
  lng: number;
  komoditas: string; // default: "kopi"
  luasEstimasiHa?: number; // dihitung otomatis dari boundary kalau ada (lihat lib/polygon.ts)
  gpsAccuracyM?: number; // akurasi GPS (meter)
  capturedAt: number;
  // Batas kebun hasil jalan-keliling-sudut Agen (opsional — plot lama/titik-tunggal
  // tidak punya ini). Minimal 3 titik kalau ada. Lihat lib/polygon.ts untuk cara
  // hitung centroid & luas darinya.
  boundary?: { lat: number; lng: number }[];
  // Periode produksi (EUDR mewajibkan geolokasi DISERTAI waktu/periode produksi
  // komoditas, bukan cuma titik/poligon lokasinya saja — lihat docs/01_BLUEPRINT_FULL.md).
  // Format YYYY-MM-DD. Opsional supaya plot lama tanpa data ini tetap valid.
  periodeProduksiMulai?: string;
  periodeProduksiSelesai?: string;
}

export type DeforestasiStatus = 'aman' | 'berisiko' | 'perlu-audit';

export interface DeforestasiCheck {
  plotId: string;
  status: DeforestasiStatus;
  rasterValue: number; // nilai piksel raster
  catatanError: string; // disclose commission error 18%
  checkedAt: number;
}

export type Tier = 'lokal' | 'export-ready';
export type StdbStatus = 'stdb-ready' | 'belum-lengkap';

export interface Kartu extends Syncable {
  id: string;
  plotId: string;
  petaniId: string;
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[]; // kenapa ready / belum
  deforestasi: DeforestasiStatus;
  hashChainRef: string; // id entri hash-chain terakhir
  createdAt: number;
  // Catatan tindakan mitigasi risiko deforestasi (restorasi, reboisasi, audit lapangan,
  // dll) yang dicatat petugas saat status berisiko/perlu-audit. Murni advisory/log —
  // TIDAK memengaruhi tier/stdbStatus (itu tetap deterministik lewat lib/ruleEngine.ts).
  mitigasiRisiko?: string;
  mitigasiRisikoUpdatedAt?: number;
}

// ===== HASH-CHAIN =====

export interface HashChainEntry extends Syncable {
  id: string;
  index: number; // urutan dalam rantai
  timestamp: number;
  payload: unknown; // data yang di-hash (snapshot kartu)
  dataHash: string; // hash dari payload
  previousHash: string; // hash entri sebelumnya
  hash: string; // hash gabungan (index+timestamp+dataHash+previousHash)
}

// ===== CONSENT & NOTIF =====

export interface ConsentRecord extends Syncable {
  id: string;
  kartuId: string;
  grantedTo: string; // "bank" | "eksportir" | "koperasi" | nama
  scope: string[]; // ["lokasi","status","dokumen"]
  grantedAt: number;
  revokedAt?: number;
}

export interface AccessLog extends Syncable {
  id: string;
  kartuId: string;
  accessedBy: string;
  authorized: boolean; // false -> memicu notif
  timestamp: number;
  triggeredNotif: boolean;
}

export interface NotifItem extends Syncable {
  id: string;
  message: string;
  kartuId: string;
  severity: 'info' | 'warning' | 'alert';
  createdAt: number;
  read: boolean;
}

// ===== DOKUMEN PETANI (kelengkapan berkas — lihat docs/04_FULL_PRODUCTION_BLUEPRINT.md,
// bagian "Dokumen Petani Terverifikasi") =====
// Hanya metadata + hash file yang disimpan/disinkron — file aslinya TIDAK diunggah ke
// server pada fase ini (keputusan sadar untuk menghindari kompleksitas & sensitivitas
// penyimpanan dokumen identitas sungguhan seperti KTP/KK).

export type DocumentType =
  | 'ktp'
  | 'kk'
  | 'bukti-kepemilikan-lahan'
  | 'bukti-pbb'
  | 'surat-persetujuan-tetangga'
  | 'stdb'
  | 'foto-plot'
  | 'riwayat-panen'
  | 'riwayat-transaksi'
  | 'sertifikat-pelatihan';

export interface PetaniDocument extends Syncable {
  id: string;
  petaniId: string;
  type: DocumentType;
  fileName: string;
  fileHash: string; // SHA-256 isi file — dicatat ke hash-chain sebagai bukti belum-diubah
  fileSizeBytes: number;
  uploadedAt: number;
  verified: boolean; // dikonfirmasi petugas/koperasi secara manual, bukan otomatis
  notes?: string;
}

// ===== TRANSAKSI & HARGA REFERENSI (Sprint 20 — lihat docs/09_UPGRADE_BLUEPRINT.md §4.2)
// Harga referensi = AGREGAT transparan dari transaksi terverifikasi, BUKAN angka yang
// diset satu pihak (eksportir) — ini yang melindungi petani dari harga sepihak/menipu.

export interface Transaksi extends Syncable {
  id: string;
  komoditas: string;
  wilayah: string;
  grade: string; // boleh kosong ('') kalau komoditas tidak punya pemisahan grade
  hargaPerKg: number; // Rupiah
  tanggal: string; // YYYY-MM-DD
  verified: boolean; // dikonfirmasi Agen di lapangan saat rekam transaksi
  createdAt: number;
}
