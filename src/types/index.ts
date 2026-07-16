export type Tier = 'lokal' | 'export_ready';
export type StdbStatus = 'lengkap' | 'belum_lengkap';
export type DeforestasiStatus = 'aman' | 'terindikasi' | 'di_luar_area';

export interface Petani {
  id: string;
  nama: string;
  desa?: string;
  telepon?: string;
  createdAt: string;
}

export interface Plot {
  id: string;
  petaniId: string;
  lat: number;
  lng: number;
  komoditas: string;
  gpsAccuracyM?: number;
  capturedAt: string;
}

export interface DeforestasiCheck {
  status: DeforestasiStatus;
  cellValue: number | null;
  source: string;
  catatan: string;
}

export interface Kartu {
  id: string;
  petaniId: string;
  plotId: string;
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[];
  deforestasi: DeforestasiCheck;
  overrideManual: boolean;
  createdAt: string;
}

export interface HashChainEntry {
  index: number;
  timestamp: string;
  dataHash: string;
  previousHash: string;
  hash: string;
}

export interface ConsentRecord {
  id: string;
  kartuId: string;
  pihak: string;
  granted: boolean;
  updatedAt: string;
}

export interface AccessLog {
  id: string;
  kartuId: string;
  pihak: string;
  authorized: boolean;
  timestamp: string;
}

export interface NotifItem {
  id: string;
  pesan: string;
  severity: 'info' | 'alert';
  read: boolean;
  createdAt: string;
}
