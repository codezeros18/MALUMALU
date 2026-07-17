import { useCallback, useEffect, useState } from 'react';
import { listDocumentsByPetani } from '../lib/db';
import { registerDocument } from '../lib/documents';
import { getDocumentCompleteness, REQUIRED_DOCUMENT_TYPES } from '../lib/ruleEngine';
import Card from './ui/Card';
import Badge from './ui/Badge';
import type { BadgeTone } from './ui/Badge';
import type { DocumentType, PetaniDocument } from '../types';

// Pengelompokan sesuai kategori yang dipetakan ke syarat EUDR/STDB — lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md, bagian "Dokumen Petani Terverifikasi".
// Dokumen wajib (REQUIRED_DOCUMENT_TYPES di lib/ruleEngine.ts) ditandai terpisah;
// sisanya tercatat sebagai nilai tambah, bukan syarat "Berkas Lengkap".
const CATEGORIES: { title: string; types: DocumentType[] }[] = [
  { title: 'Identitas', types: ['ktp', 'kk'] },
  {
    title: 'Legalitas Lahan',
    types: ['bukti-kepemilikan-lahan', 'bukti-pbb', 'surat-persetujuan-tetangga', 'stdb'],
  },
  { title: 'Data Teknis Kebun', types: ['foto-plot', 'riwayat-panen'] },
  { title: 'Dokumen Pendukung', types: ['riwayat-transaksi', 'sertifikat-pelatihan'] },
];

const LABELS: Record<DocumentType, string> = {
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  'bukti-kepemilikan-lahan': 'Bukti Kepemilikan/Penguasaan Lahan (Sertifikat/SKT/SP2FBT)',
  'bukti-pbb': 'Bukti Bayar PBB (1 tahun terakhir)',
  'surat-persetujuan-tetangga': 'Surat Persetujuan Tetangga (RT/Kades/Camat)',
  stdb: 'STDB',
  'foto-plot': 'Foto Plot & Tanaman',
  'riwayat-panen': 'Riwayat Panen',
  'riwayat-transaksi': 'Bukti Transaksi/Histori Jual',
  'sertifikat-pelatihan': 'Sertifikat Pelatihan/Kelompok Tani',
};

interface DocumentUploadProps {
  petaniId: string;
  // Dipanggil setiap daftar dokumen berubah — dipakai PlotDetail.tsx untuk mengunci
  // checklist "Sudah punya STDB" ke bukti dokumen STDB yang sungguh-sungguh diunggah,
  // bukan klaim manual tanpa bukti.
  onDocumentsChange?: (documents: PetaniDocument[]) => void;
  // Sembunyikan kontrol unggah/ganti — dipakai Portal Petani supaya petani hanya bisa
  // melihat status dokumen, bukan mengubah bukti legalitas yang diunggah petugas.
  readOnly?: boolean;
}

function sortRequiredFirst(types: DocumentType[]): DocumentType[] {
  return [...types].sort(
    (a, b) => Number(REQUIRED_DOCUMENT_TYPES.includes(b)) - Number(REQUIRED_DOCUMENT_TYPES.includes(a)),
  );
}

function statusFor(doc: PetaniDocument | undefined): { label: string; tone: BadgeTone } {
  if (!doc) return { label: 'Belum ada', tone: 'neutral' };
  if (doc.verified) return { label: 'Terverifikasi', tone: 'aman' };
  if (doc.syncStatus === 'synced') return { label: 'Tersinkron', tone: 'synced' };
  return { label: 'Tersimpan lokal', tone: 'pending' };
}

export default function DocumentUpload({
  petaniId,
  onDocumentsChange,
  readOnly = false,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<PetaniDocument[]>([]);
  const [busyType, setBusyType] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const docs = await listDocumentsByPetani(petaniId);
      setDocuments(docs);
      onDocumentsChange?.(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dokumen.');
    }
  }, [petaniId, onDocumentsChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFileChange = async (type: DocumentType, file: File | undefined) => {
    if (!file) return;
    setBusyType(type);
    setError(null);
    try {
      await registerDocument(petaniId, type, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan dokumen.');
    } finally {
      setBusyType(null);
    }
  };

  const completeness = getDocumentCompleteness(documents);
  const docByType = new Map(documents.map((d) => [d.type, d]));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Dokumen Petani</h2>
        <Badge tone={completeness.complete ? 'aman' : 'perlu-audit'}>
          {completeness.complete ? 'Berkas Lengkap' : 'Berkas Belum Lengkap'}
        </Badge>
      </div>
      <p className="text-xs text-slate-500">
        Hanya hash & metadata file yang disimpan/disinkron — file asli tidak diunggah ke server.
        Hash dicatat ke hash-chain sebagai bukti belum-diubah.
      </p>
      <p className="text-xs text-slate-500">
        <span className="text-red-500 font-medium">*</span> = wajib untuk status "Berkas
        Lengkap" (KTP, Bukti Kepemilikan Lahan, STDB) — dasar legalitas tier Export-Ready.
        Sisanya nilai tambah opsional, ditampilkan setelah yang wajib di tiap kategori.
      </p>

      {CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600">{cat.title}</p>
          <ul className="space-y-1.5">
            {sortRequiredFirst(cat.types).map((type) => {
              const doc = docByType.get(type);
              const status = statusFor(doc);
              const required = REQUIRED_DOCUMENT_TYPES.includes(type);
              return (
                <li
                  key={type}
                  className="flex items-center justify-between gap-2 text-xs border border-slate-100 rounded px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">
                      {LABELS[type]}
                      {required && <span className="text-red-500"> *</span>}
                    </p>
                    {doc && <p className="text-slate-400 truncate">{doc.fileName}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {!readOnly && (
                      <label className="text-brand-800 font-medium cursor-pointer hover:underline">
                        {busyType === type ? 'Menyimpan…' : doc ? 'Ganti' : 'Unggah'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          capture="environment"
                          className="hidden"
                          disabled={busyType !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            void handleFileChange(type, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
