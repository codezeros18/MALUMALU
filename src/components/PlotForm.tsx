import { useState, type FormEvent } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

export interface PlotFormValues {
  nama: string;
  desa: string;
  telepon: string;
  komoditas: string;
  email: string;
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
  const [email, setEmail] = useState('');

  const canSubmit = Boolean(position) && nama.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      nama: nama.trim(),
      desa: desa.trim(),
      telepon: telepon.trim(),
      komoditas,
      email: email.trim(),
    });
    setNama('');
    setDesa('');
    setTelepon('');
    setKomoditas('kopi');
    setEmail('');
  };

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-3">
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
        <Button
          type="button"
          onClick={onUseGps}
          disabled={gpsLoading}
          fullWidth
          className="mt-2"
        >
          {gpsLoading ? 'Mengambil lokasi…' : 'Pakai GPS'}
        </Button>
        {gpsError && <p className="text-xs text-red-600 mt-1">{gpsError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nama petani *</label>
        <Input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          className="mt-1 w-full text-base"
          placeholder="Nama lengkap"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Desa</label>
        <Input
          value={desa}
          onChange={(e) => setDesa(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Opsional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Komoditas</label>
        <Input
          value={komoditas}
          onChange={(e) => setKomoditas(e.target.value)}
          className="mt-1 w-full text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Telepon</label>
        <Input
          value={telepon}
          onChange={(e) => setTelepon(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Opsional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Email petani (opsional, untuk akses portal)
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Opsional — dipakai petani untuk lihat data sendiri di Portal Petani"
        />
      </div>

      <Button type="submit" disabled={!canSubmit} fullWidth size="md" className="py-3 text-base font-semibold">
        {submitting ? 'Menyimpan…' : 'Simpan Plot'}
      </Button>
    </Card>
  );
}
