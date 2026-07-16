// Kontrak tipe antar-modul (FS <-> AI). Lihat docs/02_TECH_ARCHITECTURE.md — jarang berubah.

// ===== ENTITAS INTI =====

export interface Petani {
  id: string;
  nama: string;
  nikHash?: string; // NIK di-hash (jangan simpan plaintext)
  telepon?: string;
  desa?: string;
  createdAt: number;
}

export interface Plot {
  id: string;
  petaniId: string;
  lat: number;
  lng: number;
  komoditas: string; // default: "kopi"
  luasEstimasiHa?: number;
  gpsAccuracyM?: number; // akurasi GPS (meter)
  capturedAt: number;
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

export interface Kartu {
  id: string;
  plotId: string;
  petaniId: string;
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[]; // kenapa ready / belum
  deforestasi: DeforestasiStatus;
  hashChainRef: string; // id entri hash-chain terakhir
  createdAt: number;
}

// ===== HASH-CHAIN =====

export interface HashChainEntry {
  id: string;
  index: number; // urutan dalam rantai
  timestamp: number;
  payload: unknown; // data yang di-hash (snapshot kartu)
  dataHash: string; // hash dari payload
  previousHash: string; // hash entri sebelumnya
  hash: string; // hash gabungan (index+timestamp+dataHash+previousHash)
}

// ===== CONSENT & NOTIF =====

export interface ConsentRecord {
  id: string;
  kartuId: string;
  grantedTo: string; // "bank" | "eksportir" | "koperasi" | nama
  scope: string[]; // ["lokasi","status","dokumen"]
  grantedAt: number;
  revokedAt?: number;
}

export interface AccessLog {
  id: string;
  kartuId: string;
  accessedBy: string;
  authorized: boolean; // false -> memicu notif
  timestamp: number;
  triggeredNotif: boolean;
}

export interface NotifItem {
  id: string;
  message: string;
  kartuId: string;
  severity: 'info' | 'warning' | 'alert';
  createdAt: number;
  read: boolean;
}
