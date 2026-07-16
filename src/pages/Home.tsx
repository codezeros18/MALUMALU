import { useCallback, useEffect, useState } from 'react';
import MapView from '../components/MapView';
import PlotForm, { type PlotFormValues } from '../components/PlotForm';
import { useGeolocation } from '../hooks/useGeolocation';
import { addPetani, addPlot, listAllPlot } from '../lib/db';
import { setItem } from '../lib/storage';
import type { Plot } from '../types';

export default function Home() {
  const {
    position: gpsPosition,
    loading: gpsLoading,
    error: gpsError,
    request: requestGps,
  } = useGeolocation();

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshPlots = useCallback(async () => {
    try {
      setPlots(await listAllPlot());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshPlots();
  }, [refreshPlots]);

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

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold text-brand-800">Paspor Petani</h1>
        <p className="text-sm text-slate-600">
          Tap peta atau pakai GPS untuk menandai lokasi kebun, lalu isi data petani singkat.
        </p>
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
            <li
              key={plot.id}
              className="text-xs text-slate-500 border border-slate-200 rounded px-2 py-1"
            >
              {plot.komoditas} @ {plot.lat.toFixed(5)}, {plot.lng.toFixed(5)}
              {plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
