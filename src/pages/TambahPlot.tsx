import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import MapView from '../components/MapView';
import PlotForm, { type PlotFormValues } from '../components/PlotForm';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { addPetani, addPlot, listAllPlot } from '../lib/db';
import { setItem } from '../lib/storage';
import type { Plot } from '../types';

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

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    listAllPlot().then(setPlots).catch(console.error);
  }, []);

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
        email: values.email || undefined,
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
      setPlots(await listAllPlot());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan plot.');
    } finally {
      setSaving(false);
    }
  };

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
        <SectionCard title="Lokasi Kebun" description="Tap di peta untuk menandai titik kebun.">
          <MapView
            plots={plots}
            onPickLocation={handlePickLocation}
            pickedPosition={picked}
            className="h-80 sm:h-[28rem]"
          />
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
