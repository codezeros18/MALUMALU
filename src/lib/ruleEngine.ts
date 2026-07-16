import { nanoid } from 'nanoid';
import type {
  Petani,
  Plot,
  DeforestasiCheck,
  DeforestasiStatus,
  Tier,
  StdbStatus,
  Kartu,
  DocumentType,
  PetaniDocument,
} from '../types';

export interface RuleEngineInput {
  nama: string;
  lat: number;
  lng: number;
  komoditas: string;
  deforestasi: DeforestasiStatus;
  punyaSTDB: boolean;
  klaimKepemilikan: boolean;
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function dataIntiLengkap(input: RuleEngineInput): boolean {
  return Boolean(input.nama?.trim()) && isValidCoord(input.lat, input.lng) && Boolean(input.komoditas?.trim());
}

/**
 * Tentukan tier (lokal | export-ready). Deterministik: export-ready HANYA jika
 * petani sudah punya STDB, area dinyatakan "aman" (bukan perlu-audit/berisiko),
 * dan data inti (nama, koordinat, komoditas) lengkap. Selain itu 'lokal'.
 */
export function tentukanTier(input: RuleEngineInput): Tier {
  const eligible = input.punyaSTDB && input.deforestasi === 'aman' && dataIntiLengkap(input);
  return eligible ? 'export-ready' : 'lokal';
}

/**
 * Tentukan status STDB + alasan (untuk transparansi/audit).
 * 'stdb-ready' jika: nama ada, koordinat valid, klaim kepemilikan dikonfirmasi,
 * dan status deforestasi BUKAN 'berisiko' ('aman' atau 'perlu-audit' keduanya lolos —
 * commission error peta JRC ~18% berarti 'perlu-audit' tidak boleh langsung menggagalkan).
 * Setiap syarat yang kurang menambah alasan spesifik; 'perlu-audit' selalu menambah
 * catatan audit manual meski status akhirnya tetap 'stdb-ready'.
 */
export function tentukanStdbStatus(input: RuleEngineInput): { status: StdbStatus; alasan: string[] } {
  const alasan: string[] = [];

  const namaAda = Boolean(input.nama?.trim());
  if (!namaAda) alasan.push('Nama petani belum diisi.');

  const koordinatValid = isValidCoord(input.lat, input.lng);
  if (!koordinatValid) alasan.push('Koordinat plot tidak valid.');

  if (!input.klaimKepemilikan) alasan.push('Klaim kepemilikan lahan belum dikonfirmasi.');

  if (input.deforestasi === 'berisiko') {
    alasan.push(
      'Area berisiko deforestasi tinggi — STDB tidak dapat diproses sampai audit manual selesai.',
    );
  } else if (input.deforestasi === 'perlu-audit') {
    alasan.push(
      'Perlu audit manual (peta JRC ~91% akurasi, commission error ~18%; kebun kopi bernaung bisa terbaca hutan).',
    );
  }

  const ready = namaAda && koordinatValid && input.klaimKepemilikan && input.deforestasi !== 'berisiko';

  if (ready && alasan.length === 0) {
    alasan.push('Semua syarat STDB terpenuhi: nama, koordinat, dan klaim kepemilikan lengkap; area aman.');
  }

  return { status: ready ? 'stdb-ready' : 'belum-lengkap', alasan };
}

export interface GenerateKartuParams {
  petani: Petani;
  plot: Plot;
  check: DeforestasiCheck;
  punyaSTDB: boolean;
  klaimKepemilikan: boolean;
}

/**
 * Rakit Kartu dari hasil aturan di atas. Fungsi PURE — tidak menyimpan ke DB dan
 * tidak mengisi hashChainRef (diisi FS di Sprint 6 setelah entri hash-chain dibuat).
 */
export function generateKartu(params: GenerateKartuParams): Kartu {
  const input: RuleEngineInput = {
    nama: params.petani.nama,
    lat: params.plot.lat,
    lng: params.plot.lng,
    komoditas: params.plot.komoditas,
    deforestasi: params.check.status,
    punyaSTDB: params.punyaSTDB,
    klaimKepemilikan: params.klaimKepemilikan,
  };

  const tier = tentukanTier(input);
  const { status: stdbStatus, alasan } = tentukanStdbStatus(input);

  return {
    id: nanoid(),
    plotId: params.plot.id,
    petaniId: params.petani.id,
    tier,
    stdbStatus,
    alasan,
    deforestasi: params.check.status,
    hashChainRef: '',
    createdAt: Date.now(),
  };
}

// ===== KELENGKAPAN DOKUMEN (fitur "Berkas Lengkap", lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md, bagian "Dokumen Petani Terverifikasi") =====
// Fungsi PURE terpisah dari tentukanTier/tentukanStdbStatus di atas — TIDAK mengubah
// logika tier/STDB yang sudah ada, hanya sinyal kelengkapan berkas tambahan yang
// ditampilkan berdampingan (dipakai panel "Petani Terverifikasi Terdekat" Eksportir).

// Dokumen minimum wajib untuk status "Berkas Lengkap" — dasar legalitas STDB:
// identitas (KTP), bukti kepemilikan lahan, dan STDB itu sendiri. Dokumen lain
// (KK, PBB, surat tetangga, foto plot, riwayat panen/transaksi, sertifikat pelatihan)
// tercatat sebagai nilai tambah, bukan syarat wajib kelengkapan.
export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = ['ktp', 'bukti-kepemilikan-lahan', 'stdb'];

export interface DocumentCompleteness {
  complete: boolean;
  missing: DocumentType[];
}

export function getDocumentCompleteness(documents: PetaniDocument[]): DocumentCompleteness {
  const presentTypes = new Set(documents.map((d) => d.type));
  const missing = REQUIRED_DOCUMENT_TYPES.filter((type) => !presentTypes.has(type));
  return { complete: missing.length === 0, missing };
}
