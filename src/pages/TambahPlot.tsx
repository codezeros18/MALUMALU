import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import MapView from '../components/MapView';
import PlotForm, { type PlotFormValues } from '../components/PlotForm';
import PolygonDrawer from '../components/PolygonDrawer';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { addPetani, addPlot, listAllPlot } from '../lib/db';
import { setItem } from '../lib/storage';
import { computeAreaHa, computeCentroid, type LatLng } from '../lib/polygon';
import type { Plot } from '../types';

type Mode = 'titik' | 'poligon';

const TIPS = [
  'Tap langsung di peta 3D, atau pakai tombol "Pakai GPS" untuk koordinat otomatis.',
  'Akurasi GPS di bawah kanopi kopi bisa meleset 3–11 m — ini normal, bukan kesalahan.',
  'Data tersimpan lokal dulu di perangkat, lalu disinkron ke Supabase saat online.',
  'Email petani (tanpa *) dibutuhkan supaya petani bisa cek datanya sendiri di Portal Petani.',
];

export default function TambahPlot() {
  const {
    position: gpsPosition,
    loading: gpsLoading,
    error: gpsError,
    request: requestGps,
  } = useGeolocation();

  const [mode, setMode] = useState<Mode>('titik');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [polygonFinished, setPolygonFinished] = useState(false);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    listAllPlot().then(setPlots).catch(console.error);
  }, []);

  useEffect(() => {
    if (gpsPosition && mode === 'titik') {
      setPicked({ lat: gpsPosition.lat, lng: gpsPosition.lng });
      setAccuracyM(gpsPosition.accuracyM);
    }
  }, [gpsPosition, mode]);

  const resetDrawing = () => {
    setDrawingPoints([]);
    setPolygonFinished(false);
    setPicked(null);
    setAccuracyM(null);
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    resetDrawing();
  };

  const handlePickLocation = (lat: number, lng: number) => {
    if (mode === 'poligon') {
      if (polygonFinished) return; // sudah selesai — reset dulu kalau mau ubah
      setDrawingPoints((prev) => [...prev, { lat, lng }]);
      return;
    }
    setPicked({ lat, lng });
    setAccuracyM(null); // tap manual -> akurasi GPS tidak berlaku
  };

  const handleFinishPolygon = () => {
    setPicked(computeCentroid(drawingPoints));
    setAccuracyM(null);
    setPolygonFinished(true);
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
        email: values.email || undefined,
      });
      const usePolygon = mode === 'poligon' && polygonFinished;
      const plot = await addPlot({
        petaniId: petani.id,
        lat: picked.lat,
        lng: picked.lng,
        komoditas: values.komoditas,
        gpsAccuracyM: accuracyM ?? undefined,
        capturedAt: Date.now(),
        boundary: usePolygon ? drawingPoints : undefined,
        luasEstimasiHa: usePolygon ? computeAreaHa(drawingPoints) : undefined,
      });
      setItem('active-petani-id', petani.id);
      setItem('active-plot-id', plot.id);
      setSavedMessage(`Plot tersimpan untuk ${petani.nama}.`);
      resetDrawing();
      setPlots(await listAllPlot());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan plot.');
    } finally {
      setSaving(false);
    }
  };

  const areaHa = drawingPoints.length >= 3 ? computeAreaHa(drawingPoints) : 0;

  return (
    <div className="max-w-5xl">
      <PageHeader
        backTo="/agen"
        backLabel="Kembali ke Ringkasan"
        icon={Plus}
        title="Tandai Plot Baru"
        description="Tap peta atau pakai GPS untuk menandai lokasi kebun, lalu isi data petani singkat."
      />

      {savedMessage && (
        <div className="rounded-md bg-brand-50 border border-brand-400 text-brand-800 px-3 py-2 text-sm mb-4">
          {savedMessage}
        </div>
      )}
      {saveError && (
        <div className="rounded-md bg-red-50 border border-red-300 text-red-700 px-3 py-2 text-sm mb-4">
          {saveError}
        </div>
      )}

      <div className="space-y-6">
        <SectionCard
          title="Lokasi Kebun"
          description={
            mode === 'titik'
              ? 'Tap di peta untuk menandai satu titik kebun.'
              : 'Jalan ke tiap sudut kebun, catat titik lewat GPS atau tap di peta.'
          }
        >
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleModeChange('titik')}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                mode === 'titik'
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Titik Tunggal (cepat)
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('poligon')}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                mode === 'poligon'
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Poligon (batas kebun)
            </button>
          </div>

          <MapView
            plots={plots}
            onPickLocation={handlePickLocation}
            pickedPosition={mode === 'titik' ? picked : null}
            drawingPoints={mode === 'poligon' ? drawingPoints : undefined}
            className="h-80 sm:h-[28rem]"
          />

          {mode === 'poligon' && !polygonFinished && (
            <div className="mt-3">
              <PolygonDrawer
                points={drawingPoints}
                onAddPoint={(p) => setDrawingPoints((prev) => [...prev, p])}
                onRemoveLast={() => setDrawingPoints((prev) => prev.slice(0, -1))}
                onFinish={handleFinishPolygon}
                onReset={resetDrawing}
                disabled={saving}
              />
            </div>
          )}

          {mode === 'poligon' && polygonFinished && (
            <div className="mt-3 flex items-center justify-between text-sm bg-brand-50 border border-brand-400 rounded-md px-3 py-2">
              <span className="text-brand-800 font-medium">
                Poligon selesai — {drawingPoints.length} titik, ~
                {areaHa < 1 ? `${Math.round(areaHa * 10000)} m²` : `${areaHa.toFixed(2)} ha`}
              </span>
              <button type="button" onClick={resetDrawing} className="text-xs text-slate-500 hover:underline">
                Ubah poligon
              </button>
            </div>
          )}
        </SectionCard>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionCard title="Data Petani">
              <PlotForm
                position={picked}
                gpsLoading={gpsLoading}
                gpsError={gpsError}
                accuracyM={accuracyM}
                onUseGps={requestGps}
                onSubmit={handleSubmit}
                submitting={saving}
                hideGpsButton={mode === 'poligon'}
                bare
              />
            </SectionCard>
          </div>

          <SectionCard title="Tips Pengambilan Lokasi">
            <ul className="space-y-2 text-xs text-slate-500 leading-relaxed">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-brand-400 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
