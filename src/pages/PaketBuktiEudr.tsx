import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import { isAuthorized } from '../lib/consent';
import { getDocumentCompleteness } from '../lib/ruleEngine';
import { getPolygonRisk, type PolygonRiskResult } from '../lib/geospatial';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import DocumentUpload from '../components/DocumentUpload';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PageLoader from '../components/ui/PageLoader';
import type { Kartu, Petani, Plot, PetaniDocument, HashChainEntry } from '../types';

const RISK_TONE: Record<PolygonRiskResult['risk'], 'aman' | 'perlu-audit' | 'berisiko'> = {
  rendah: 'aman',
  sedang: 'perlu-audit',
  tinggi: 'berisiko',
};
const RISK_LABEL: Record<PolygonRiskResult['risk'], string> = {
  rendah: 'Risiko Rendah',
  sedang: 'Risiko Sedang — Perlu Audit',
  tinggi: 'Risiko Tinggi — Perlu Audit',
};
const DEFORESTASI_LABEL: Record<Kartu['deforestasi'], string> = {
  aman: 'Aman',
  'perlu-audit': 'Perlu Audit',
  berisiko: 'Berisiko',
};

export default function PaketBuktiEudr() {
  const { kartuId } = useParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kartu, setKartu] = useState<Kartu | null>(null);
  const [petani, setPetani] = useState<Petani | null>(null);
  const [plot, setPlot] = useState<Plot | null>(null);
  const [documents, setDocuments] = useState<PetaniDocument[]>([]);
  const [agentHashEntries, setAgentHashEntries] = useState<HashChainEntry[]>([]);
  const [polygonRisk, setPolygonRisk] = useState<PolygonRiskResult | null>(null);

  useEffect(() => {
    if (!kartuId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Guard akses SEBELUM fetch data apa pun — halaman ini bisa dibuka langsung
        // lewat URL, bukan cuma lewat tombol "Lihat Paket Bukti EUDR" di Petani
        // Terdekat, jadi sembunyikan tombol saja di UI lain TIDAK cukup.
        const isAuthed = await isAuthorized(kartuId, 'Eksportir');
        if (cancelled) return;
        setAuthorized(isAuthed);
        if (!isAuthed) {
          setLoading(false);
          return;
        }

        const [kartuRows, petaniRows, plotRows, docRows, hashRows] = await Promise.all([
          supabaseBackend.fetchAll('kartu'),
          supabaseBackend.fetchAll('petani'),
          supabaseBackend.fetchAll('plot'),
          supabaseBackend.fetchAll('petaniDocument'),
          supabaseBackend.fetchAll('hashchain'),
        ]);
        if (cancelled) return;

        const kartuList = kartuRows.map((r) => fromSupabaseRow<Kartu>(r));
        const petaniList = petaniRows.map((r) => fromSupabaseRow<Petani>(r));
        const plotList = plotRows.map((r) => fromSupabaseRow<Plot>(r));
        const docList = docRows.map((r) => fromSupabaseRow<PetaniDocument>(r));
        const hashList = hashRows.map((r) => fromSupabaseRow<HashChainEntry>(r));

        const foundKartu = kartuList.find((k) => k.id === kartuId) ?? null;
        setKartu(foundKartu);
        if (foundKartu) {
          const foundPetani = petaniList.find((p) => p.id === foundKartu.petaniId) ?? null;
          const foundPlot = plotList.find((p) => p.id === foundKartu.plotId) ?? null;
          setPetani(foundPetani);
          setPlot(foundPlot);
          setDocuments(docList.filter((d) => d.petaniId === foundKartu.petaniId));
          // Grup per-agentId (bukan per-kartu) — pola sama seperti EksportirDashboard.tsx,
          // konsisten dengan catatan integritas hash-chain lintas-device.
          setAgentHashEntries(hashList.filter((h) => h.agentId === foundKartu.agentId));

          if (foundPlot?.boundary && foundPlot.boundary.length >= 3) {
            const risk = await getPolygonRisk(foundPlot.boundary);
            if (!cancelled) setPolygonRisk(risk);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kartuId]);

  if (!kartuId) return null;

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-xl">
        {error}
      </p>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Akses ditolak — petani belum memberi izin ke "Eksportir". Klik "Hubungi" di
          halaman Petani Terdekat dulu untuk meminta izin.
        </p>
        <Link
          to="/eksportir/terdekat"
          className="inline-flex items-center gap-1.5 text-sm text-brand-800 hover:underline mt-3"
        >
          <ArrowLeft size={15} />
          Kembali ke Petani Terdekat
        </Link>
      </div>
    );
  }

  if (!kartu || !petani) {
    return <EmptyState message="Data kartu/petani tidak ditemukan." />;
  }

  const completeness = getDocumentCompleteness(documents);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          to="/eksportir/terdekat"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Petani Terdekat
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={14} className="inline mr-1.5 -mt-0.5" />
          Cetak / Unduh PDF
        </Button>
      </div>

      <Card className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
          Paket Bukti Uji Tuntas — Referensi EUDR
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Dokumen pendukung dari data yang tercatat platform — <strong>BUKAN Due
          Diligence Statement resmi</strong>. Pengajuan DDS ke sistem Uni Eropa tetap
          tanggung jawab operator/eksportir sesuai proses regulasi mereka sendiri.
        </p>
      </Card>

      <Card className="space-y-1">
        <p className="text-xs text-slate-400">Petani</p>
        <p className="text-lg font-semibold text-brand-800">{petani.nama}</p>
        <p className="text-sm text-slate-600">
          {petani.desa || '—'} · {plot?.komoditas ?? '—'}
        </p>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Geolokasi</p>
        <p className="text-sm text-slate-600">
          Periode produksi:{' '}
          {plot?.periodeProduksiMulai || plot?.periodeProduksiSelesai ? (
            `${plot.periodeProduksiMulai || '—'} s/d ${plot.periodeProduksiSelesai || '—'}`
          ) : (
            <span className="text-amber-700">Belum diisi — EUDR mensyaratkan geolokasi disertai periode produksi.</span>
          )}
        </p>
        {plot?.boundary && plot.boundary.length >= 3 ? (
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Poligon batas kebun — {plot.boundary.length} titik
              {plot.luasEstimasiHa
                ? `, ~${plot.luasEstimasiHa < 1 ? `${Math.round(plot.luasEstimasiHa * 10000)} m²` : `${plot.luasEstimasiHa.toFixed(2)} ha`}`
                : ''}
            </p>
            {polygonRisk && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Skor risiko deforestasi:</span>
                <Badge tone={RISK_TONE[polygonRisk.risk]}>
                  {RISK_LABEL[polygonRisk.risk]} ({polygonRisk.forestOverlapPct.toFixed(0)}% area hutan)
                </Badge>
              </div>
            )}
            {polygonRisk && (
              <p className="text-[11px] text-slate-400 leading-relaxed">{polygonRisk.catatanError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Titik tunggal — {plot ? `${plot.lat.toFixed(5)}, ${plot.lng.toFixed(5)}` : '—'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status deforestasi:</span>
              <Badge tone={kartu.deforestasi}>{DEFORESTASI_LABEL[kartu.deforestasi]}</Badge>
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Peta JRC ~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca
          hutan). Batas kebun digambar via tap peta/GPS petugas lapangan, bukan jalur GPS
          kontinu resmi. Skor/status ini indikator awal, bukan vonis — tetap perlu audit
          manual.
        </p>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Legalitas Dokumen</p>
          <Badge tone={completeness.complete ? 'aman' : 'perlu-audit'}>
            {completeness.complete ? 'Berkas Lengkap' : 'Berkas Belum Lengkap'}
          </Badge>
        </div>
      </Card>
      <DocumentUpload petaniId={petani.id} readOnly />

      <HashChainViewer entries={agentHashEntries} readOnly />

      <KartuCard kartu={kartu} readOnly />

      <Card className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Kode Verifikasi</p>
          <p className="font-mono text-xs text-slate-600 truncate">{kartu.id}</p>
        </div>
        <div className="shrink-0 bg-white p-1.5 rounded-lg border border-slate-100">
          <QRCode value={kartu.id} size={72} />
        </div>
      </Card>
    </div>
  );
}
