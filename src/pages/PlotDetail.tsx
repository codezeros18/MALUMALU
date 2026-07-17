import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import ConsentPanel from '../components/ConsentPanel';
import DocumentUpload from '../components/DocumentUpload';
import MapView from '../components/MapView';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { getPlot, getPetani, getKartuByPlot, listSyncQueue, requeueForSync } from '../lib/db';
import { commitKartu } from '../lib/hashchain';
import { generateKartu } from '../lib/ruleEngine';
import { cekDeforestasi } from '../lib/geospatial';
import { useAppContext } from '../context/AppContext';
import type { Plot, Petani, Kartu, PetaniDocument } from '../types';

export default function PlotDetail() {
  const { id } = useParams();
  const { syncVersion, triggerSync } = useAppContext();
  const [plot, setPlot] = useState<Plot | null>(null);
  const [petani, setPetani] = useState<Petani | null>(null);
  const [kartu, setKartu] = useState<Kartu | null>(null);
  const [kartuSyncFailed, setKartuSyncFailed] = useState(false);
  const [punyaSTDB, setPunyaSTDB] = useState(false);
  const [stdbDocUploaded, setStdbDocUploaded] = useState(false);
  const [klaimKepemilikan, setKlaimKepemilikan] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await getPlot(id);
      setPlot(p ?? null);
      if (p) {
        const [pet, existingKartu] = await Promise.all([
          getPetani(p.petaniId),
          getKartuByPlot(p.id),
        ]);
        setPetani(pet ?? null);
        setKartu(existingKartu ?? null);

        if (existingKartu) {
          const queue = await listSyncQueue();
          const pendingFailure = queue.some(
            (item) => item.entityId === existingKartu.id && item.attempts > 0,
          );
          setKartuSyncFailed(pendingFailure || existingKartu.syncStatus === 'conflict');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data plot.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, syncVersion]);

  // "Sudah punya STDB" harus mengikuti bukti nyata (dokumen STDB terunggah), bukan
  // klaim manual tanpa bukti — begitu dokumen ada, centang otomatis benar & terkunci.
  const handleDocumentsChange = useCallback((documents: PetaniDocument[]) => {
    const hasStdbDoc = documents.some((d) => d.type === 'stdb');
    setStdbDocUploaded(hasStdbDoc);
    if (hasStdbDoc) setPunyaSTDB(true);
  }, []);

  const handleRetrySync = async () => {
    if (kartu) {
      await requeueForSync('kartu', kartu.id);
    }
    await triggerSync();
  };

  const handleBuatKartu = async () => {
    if (!plot || !petani) return;
    setCreating(true);
    setError(null);
    try {
      const check = await cekDeforestasi(plot.lat, plot.lng, plot.id);
      const draft = generateKartu({ petani, plot, check, punyaSTDB, klaimKepemilikan });
      const committed = await commitKartu(draft);
      setKartu(committed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kartu.');
    } finally {
      setCreating(false);
    }
  };

  if (!id) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        backTo="/agen"
        backLabel="Kembali ke Ringkasan"
        icon={FileText}
        title="Detail Plot"
        description={petani ? `Petani: ${petani.nama}` : undefined}
      />

      {!plot && <p className="text-sm text-slate-500">Plot tidak ditemukan.</p>}

      {plot && petani && (
        <SectionCard title="Informasi Plot">
          <p className="text-sm text-slate-600">
            Koordinat: {plot.lat.toFixed(5)}, {plot.lng.toFixed(5)}
            {plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}
          </p>
          <p className="text-sm text-slate-600 mt-1">Komoditas: {plot.komoditas}</p>
          <p className="text-sm text-slate-600 mt-1">
            Periode produksi:{' '}
            {plot.periodeProduksiMulai || plot.periodeProduksiSelesai
              ? `${plot.periodeProduksiMulai || '—'} s/d ${plot.periodeProduksiSelesai || '—'}`
              : 'Belum diisi'}
          </p>
          {plot.boundary && plot.boundary.length >= 3 && (
            <>
              <p className="text-sm text-slate-600 mt-1">
                Luas kebun (dari poligon):{' '}
                {plot.luasEstimasiHa !== undefined
                  ? plot.luasEstimasiHa < 1
                    ? `${Math.round(plot.luasEstimasiHa * 10000)} m²`
                    : `${plot.luasEstimasiHa.toFixed(2)} ha`
                  : '—'}
              </p>
              <div className="mt-3">
                <MapView plots={[plot]} onPickLocation={() => {}} className="h-56" />
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* Dokumen ditampilkan SEBELUM form Buat Kartu — isi bukti dulu (KTP, lahan, STDB),
          baru tier/STDB kartu dihitung, supaya "Sudah punya STDB" bisa mengacu ke bukti
          nyata alih-alih klaim kosong. */}
      {petani && <DocumentUpload petaniId={petani.id} onDocumentsChange={handleDocumentsChange} />}

      {plot && petani && !kartu && (
        <Card className="space-y-3">
          <div>
            <label
              className={`flex items-center gap-2 text-sm ${stdbDocUploaded ? 'text-slate-400' : 'text-slate-700'}`}
            >
              <Checkbox
                checked={punyaSTDB}
                disabled={stdbDocUploaded}
                onChange={(e) => setPunyaSTDB(e.target.checked)}
              />
              Sudah punya STDB
            </label>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              {stdbDocUploaded
                ? 'Terverifikasi otomatis — dokumen STDB sudah diunggah di atas.'
                : 'Belum ada dokumen STDB terunggah — ini masih klaim manual tanpa bukti. Sebaiknya unggah dokumen STDB di atas dulu.'}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={klaimKepemilikan}
              onChange={(e) => setKlaimKepemilikan(e.target.checked)}
            />
            Klaim kepemilikan dikonfirmasi
          </label>
          <Button onClick={handleBuatKartu} disabled={creating} fullWidth className="font-semibold">
            {creating ? 'Membuat kartu…' : 'Buat & Commit Kartu'}
          </Button>
        </Card>
      )}

      {kartu && (
        <KartuCard
          kartu={kartu}
          onKartuUpdated={setKartu}
          syncFailed={kartuSyncFailed}
          onRetrySync={handleRetrySync}
        />
      )}
      {kartu && <HashChainViewer refreshSignal={kartu.hashChainRef} />}
      {kartu && <ConsentPanel kartuId={kartu.id} />}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
