export type Role = 'agen' | 'petani' | 'eksportir';

export interface Petani {
  id: string;
  name: string;
  nik: string;
  phone: string;
  group: string; // e.g., "Koperasi Produsen Kopi Klasik"
  registrationDate: string;
  isSynced: boolean;
  photoUrl?: string;
  email?: string; // email for portal access
  desa?: string; // desa optional
}

export interface VerificationLog {
  timestamp: string;
  action: string;
  operator: string;
  hash: string;
  valid: boolean;
}

export interface Plot {
  id: string;
  petaniId: string;
  name: string;
  latitude: number;
  longitude: number;
  areaSize: number; // in hectares
  commodity: string; // e.g. "Kopi Arabika", "Teh", "Sayuran"
  forestRisk: 'Aman' | 'Risiko Rendah' | 'Risiko Tinggi';
  stdbStatus: 'Terbit' | 'Dalam Proses' | 'Belum Ada';
  tier: 'Lokal / Program' | 'Export-Ready';
  reasons: string[];
  signatureHash: string; // tamper-evident signature (SHA-256 hash of data fields)
  isCorrected: boolean;
  correctedNotes?: string;
  verifiedAt: string;
  logs: VerificationLog[];
  accuracyM?: number; // optional gps accuracy
  email?: string; // optional farmer email
}

export interface ConsentRequest {
  id: string;
  plotId: string;
  exporterName: string;
  status: 'diminta' | 'disetujui' | 'ditolak';
  requestedAt: string;
  respondedAt?: string;
  bidPrice?: number; // Price offered in IDR per kg
  bidStatus?: 'none' | 'pending' | 'diterima' | 'nego' | 'ditolak';
  negotiatedPrice?: number; // Price counter-offered by farmer
}

export interface AccessLog {
  id: string;
  plotId: string;
  petaniId: string;
  readerRole: string;
  readerName: string;
  purpose: string;
  timestamp: string;
  authorized: boolean;
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}
