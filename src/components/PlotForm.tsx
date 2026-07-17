import { useState, type FormEvent } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { KOMODITAS_OPTIONS, KOMODITAS_LAINNYA } from '../lib/komoditas';

export interface PlotFormValues {
  nama: string;
  desa: string;
  telepon: string;
  komoditas: string;
  email: string;
  periodeProduksiMulai: string;
  periodeProduksiSelesai: string;
}

interface PlotFormProps {
  position: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  accuracyM: number | null;
  onUseGps: () => void;
  onSubmit: (values: PlotFormValues) => void | Promise<void>;
  submitting: boolean;
  /** Render tanpa Card pembungkus — dipakai saat parent (mis. SectionCard) sudah menyediakan card-nya sendiri. */
  bare?: boolean;
  /** Sembunyikan tombol "Pakai GPS" titik-tunggal — dipakai mode Poligon, yang punya
   * alur GPS per-sudutnya sendiri lewat PolygonDrawer, bukan satu titik lewat sini. */
  hideGpsButton?: boolean;
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
  bare = false,
  hideGpsButton = false,
}: PlotFormProps) {
  const [nama, setNama] = useState('');
  const [desa, setDesa] = useState('');
  const [telepon, setTelepon] = useState('');
  const [komoditas, setKomoditas] = useState('kopi');
  const [komoditasLainnya, setKomoditasLainnya] = useState('');
  const [email, setEmail] = useState('');
  const [periodeProduksiMulai, setPeriodeProduksiMulai] = useState('');
  const [periodeProduksiSelesai, setPeriodeProduksiSelesai] = useState('');

  const isLainnya = komoditas === KOMODITAS_LAINNYA;
  const komoditasFinal = isLainnya ? komoditasLainnya.trim() : komoditas;
  const periodeInvalid = Boolean(
    periodeProduksiMulai && periodeProduksiSelesai && periodeProduksiSelesai < periodeProduksiMulai,
  );
  const canSubmit =
    Boolean(position) &&
    nama.trim().length > 0 &&
    komoditasFinal.length > 0 &&
    !periodeInvalid &&
    !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      nama: nama.trim(),
      desa: desa.trim(),
      telepon: telepon.trim(),
      komoditas: komoditasFinal,
      email: email.trim(),
      periodeProduksiMulai,
      periodeProduksiSelesai,
    });
    setNama('');
    setDesa('');
    setTelepon('');
    setKomoditas('kopi');
    setKomoditasLainnya('');
    setEmail('');
    setPeriodeProduksiMulai('');
    setPeriodeProduksiSelesai('');
  };

  const fields = (
    <>
      <div>
        <p className="text-sm font-medium text-slate-700">Koordinat plot *</p>
        {position ? (
          <p className="text-sm text-slate-600">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            {accuracyM !== null && ` · akurasi ${Math.round(accuracyM)}m`}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Selesaikan poligon batas kebun di atas dulu.</p>
        )}
        {accuracyM !== null && accuracyM > LOW_ACCURACY_THRESHOLD_M && (
          <p className="text-xs text-amber-700 mt-1">
            Akurasi rendah di bawah kanopi — penandaan bersifat point-primary, GPS bisa meleset
            3–11m.
          </p>
        )}
        {!hideGpsButton && (
          <>
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
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nama petani *</label>
        <Input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          className="mt-1 w-full text-base"
          placeholder="Contoh: Ade Supriatna"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Desa</label>
        <Input
          value={desa}
          onChange={(e) => setDesa(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Contoh: Pangalengan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Komoditas *</label>
        <Select
          value={komoditas}
          onChange={setKomoditas}
          className="mt-1 w-full"
        >
          {KOMODITAS_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k[0].toUpperCase() + k.slice(1)}
            </option>
          ))}
          <option value={KOMODITAS_LAINNYA}>Lainnya…</option>
        </Select>
        {isLainnya && (
          <Input
            value={komoditasLainnya}
            onChange={(e) => setKomoditasLainnya(e.target.value)}
            className="mt-2 w-full text-base"
            placeholder="Contoh: pinang"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Periode produksi</label>
        <p className="text-xs text-slate-400 mb-1">
          EUDR mensyaratkan geolokasi disertai waktu/periode produksi komoditas, bukan cuma titik
          lokasinya saja. Boleh dikosongkan dulu kalau belum tahu, bisa dilengkapi nanti.
        </p>
        <div className="flex gap-2">
          <Input
            type="date"
            value={periodeProduksiMulai}
            onChange={(e) => setPeriodeProduksiMulai(e.target.value)}
            className="flex-1 text-base"
          />
          <Input
            type="date"
            value={periodeProduksiSelesai}
            onChange={(e) => setPeriodeProduksiSelesai(e.target.value)}
            className="flex-1 text-base"
          />
        </div>
        {periodeInvalid && (
          <p className="text-xs text-red-600 mt-1">Tanggal selesai tidak boleh sebelum tanggal mulai.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Telepon</label>
        <Input
          value={telepon}
          onChange={(e) => setTelepon(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Contoh: 081234567890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Email petani</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full text-base"
          placeholder="Contoh: nama@email.com"
        />
        <p className="text-xs text-slate-400 mt-1">Dipakai petani untuk lihat data sendiri di Portal Petani.</p>
      </div>

      <Button type="submit" disabled={!canSubmit} fullWidth size="md" className="py-3 text-base font-semibold">
        {submitting ? 'Menyimpan…' : 'Simpan Plot'}
      </Button>
    </>
  );

  if (bare) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields}
      </form>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-3">
      {fields}
    </Card>
  );
}
