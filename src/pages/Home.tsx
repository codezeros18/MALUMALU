import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import PlotForm, { type PlotFormValues } from '../components/PlotForm';
import { useGeolocation } from '../hooks/useGeolocation';
import { addPetani, addPlot, listAllPlot, listSyncQueue } from '../lib/db';
import { setItem } from '../lib/storage';
import { seedDummyData, isDemoPlot } from '../data/dummyData';
import { useAppContext } from '../context/AppContext';
import type { Plot } from '../types';

function SyncBadge({ status, attempts }: { status?: Plot['syncStatus']; attempts: number }) {
  if (attempts > 0) {
    return (
      <span className="shrink-0 text-[10px] font-semibold bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
        Gagal sinkron
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span className="shrink-0 text-[10px] font-semibold bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
        Tersinkron
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
      Tersimpan lokal
    </span>
  );
}

export default function Home() {
  const {
    position: gpsPosition,
    loading: gpsLoading,
    error: gpsError,
    request: requestGps,
  } = useGeolocation();
  const { syncVersion, triggerSync } = useAppContext();

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [queueAttempts, setQueueAttempts] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refreshPlots = useCallback(async () => {
    try {
      setPlots(await listAllPlot());
      const queue = await listSyncQueue();
      const map = new Map<string, number>();
      for (const item of queue) {
        if (item.attempts > 0) map.set(item.entityId, item.attempts);
      }
      setQueueAttempts(map);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshPlots();
  }, [refreshPlots, syncVersion]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (gpsPosition) {
      setPicked({ lat: gpsPosition.lat, lng: gpsPosition.lng });
      setAccuracyM(gpsPosition.accuracyM);
    }
  }, [gpsPosition]);

  const handlePickLocation = (lat: number, lng: number) => {
    setPicked({ lat, lng });
    setAccuracyM(null); // tap manual -> akurasi GPS tidak berlaku
  };

  const handleSubmit = async (values: PlotFormValues) => {
    if (!picked) return;
    setSaving(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const petani = await addPetani({
        nama: values.nama,
        desa: values.desa || undefined,
        telepon: values.telepon || undefined,
      });
      const plot = await addPlot({
        petaniId: petani.id,
        lat: picked.lat,
        lng: picked.lng,
        komoditas: values.komoditas,
        gpsAccuracyM: accuracyM ?? undefined,
        capturedAt: Date.now(),
      });
      setItem('active-petani-id', petani.id);
      setItem('active-plot-id', plot.id);
      setSavedMessage(`Plot tersimpan untuk ${petani.nama}.`);
      setPicked(null);
      setAccuracyM(null);
      await refreshPlots();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan plot.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const result = await seedDummyData();
      if (result.seeded) {
        setSavedMessage(`${result.plots.length} data demo dimuat (Pangalengan, komoditas kopi).`);
        await refreshPlots();
      } else {
        setSavedMessage('DB sudah berisi data — data demo tidak dimuat ulang.');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal memuat data demo.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-brand-800">Paspor Petani</h1>
        <p className="text-sm text-slate-600">
          Tap peta atau pakai GPS untuk menandai lokasi kebun, lalu isi data petani singkat.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            className="text-xs px-3 py-1.5 rounded-md border border-brand-400 text-brand-800 disabled:opacity-50"
          >
            {seeding ? 'Memuat…' : 'Muat data demo (3 petani contoh Pangalengan)'}
          </button>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50"
          >
            {syncing ? 'Menyinkron…' : 'Sinkron sekarang'}
          </button>
        </div>
      </div>

      <MapView plots={plots} onPickLocation={handlePickLocation} pickedPosition={picked} />

      <PlotForm
        position={picked}
        gpsLoading={gpsLoading}
        gpsError={gpsError}
        accuracyM={accuracyM}
        onUseGps={requestGps}
        onSubmit={handleSubmit}
        submitting={saving}
      />

      {savedMessage && (
        <div className="rounded-md bg-brand-50 border border-brand-400 text-brand-800 px-3 py-2 text-sm">
          {savedMessage}
        </div>
      )}
      {saveError && (
        <div className="rounded-md bg-red-50 border border-red-300 text-red-700 px-3 py-2 text-sm">
          {saveError}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Plot tersimpan ({plots.length})
        </h2>
        <ul className="space-y-1">
          {plots.map((plot) => (
            <li key={plot.id}>
              <Link
                to={`/agen/plot/${plot.id}`}
                className="flex items-center justify-between gap-2 text-xs text-slate-500 border border-slate-200 rounded px-2 py-1 hover:border-brand-400 hover:text-brand-800"
              >
                <span>
                  {plot.komoditas} @ {plot.lat.toFixed(5)}, {plot.lng.toFixed(5)}
                  {plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {isDemoPlot(plot.id) && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      DATA DEMO
                    </span>
                  )}
                  <SyncBadge status={plot.syncStatus} attempts={queueAttempts.get(plot.id) ?? 0} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <details className="text-xs text-slate-500 bg-white rounded-lg border border-slate-200 p-3">
        <summary className="font-medium text-slate-600 cursor-pointer">Tentang akurasi</summary>
        <p className="mt-2 leading-relaxed">
          Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18% (kebun kopi bernaung bisa
          terbaca hutan). Titik lokasi (point-primary) karena GPS di bawah kanopi meleset 3–11 m.
          Rantai verifikasi = hash-chain (bukan blockchain). Data demo berlabel jelas dan bukan
          data pemasok nyata.
        </p>
      </details>
    </div>
  );
}
