import { useState, type FormEvent } from 'react';

export interface PlotFormValues {
  nama: string;
  desa: string;
  telepon: string;
  komoditas: string;
}

interface PlotFormProps {
  position: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  accuracyM: number | null;
  onUseGps: () => void;
  onSubmit: (values: PlotFormValues) => void | Promise<void>;
  submitting: boolean;
}

const LOW_ACCURACY_THRESHOLD_M = 20;

export default function PlotForm({
  position,
  gpsLoading,
  gpsError,
  accuracyM,
  onUseGps,
  onSubmit,
  submitting,
}: PlotFormProps) {
  const [nama, setNama] = useState('');
  const [desa, setDesa] = useState('');
  const [telepon, setTelepon] = useState('');
  const [komoditas, setKomoditas] = useState('kopi');

  const canSubmit = Boolean(position) && nama.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ nama: nama.trim(), desa: desa.trim(), telepon: telepon.trim(), komoditas });
    setNama('');
    setDesa('');
    setTelepon('');
    setKomoditas('kopi');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-white rounded-lg border border-slate-200 p-4"
    >
      <div>
        <p className="text-sm font-medium text-slate-700">Koordinat plot</p>
        {position ? (
          <p className="text-sm text-slate-600">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            {accuracyM !== null && ` · akurasi ${Math.round(accuracyM)}m`}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Belum ada koordinat — tap peta atau pakai GPS.</p>
        )}
        {accuracyM !== null && accuracyM > LOW_ACCURACY_THRESHOLD_M && (
          <p className="text-xs text-amber-700 mt-1">
            Akurasi rendah di bawah kanopi — penandaan bersifat point-primary, GPS bisa meleset
            3–11m.
          </p>
        )}
        <button
          type="button"
          onClick={onUseGps}
          disabled={gpsLoading}
          className="mt-2 w-full py-2 rounded-md bg-brand-400 text-white font-medium disabled:opacity-50"
        >
          {gpsLoading ? 'Mengambil lokasi…' : 'Pakai GPS'}
        </button>
        {gpsError && <p className="text-xs text-red-600 mt-1">{gpsError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nama petani *</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          placeholder="Nama lengkap"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Desa</label>
        <input
          value={desa}
          onChange={(e) => setDesa(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          placeholder="Opsional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Komoditas</label>
        <input
          value={komoditas}
          onChange={(e) => setKomoditas(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Telepon</label>
        <input
          value={telepon}
          onChange={(e) => setTelepon(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          placeholder="Opsional"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 rounded-md bg-brand-800 text-white font-semibold text-base disabled:opacity-40"
      >
        {submitting ? 'Menyimpan…' : 'Simpan Plot'}
      </button>
    </form>
  );
}
