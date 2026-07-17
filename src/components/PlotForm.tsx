import { useState, type FormEvent } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

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
  /** Render tanpa Card pembungkus — dipakai saat parent (mis. SectionCard) sudah menyediakan card-nya sendiri. */
  bare?: boolean;
}

const LOW_ACCURACY_THRESHOLD_M = 20;

// Daftar komoditas pertanian/perkebunan Indonesia yang umum — supaya Agen tinggal
// pilih, bukan ketik manual tiap kali. "kopi" jadi default & urutan pertama karena
// fokus utama produk (integrasi notifikasi WhatsApp tim lain juga berpusat ke kopi).
// "Lainnya" tetap disediakan sebagai jalan keluar kalau komoditasnya di luar daftar.
const KOMODITAS_OPTIONS = [
  'kopi',
  'kakao',
  'kelapa sawit',
  'kelapa',
  'karet',
  'teh',
  'tebu',
  'cengkeh',
  'lada',
  'pala',
  'vanili',
  'kayu manis',
  'padi',
  'jagung',
  'kedelai',
  'singkong',
  'ubi jalar',
  'kentang',
  'cabai',
  'bawang merah',
  'bawang putih',
  'tomat',
  'kacang tanah',
  'pisang',
  'mangga',
  'durian',
  'alpukat',
  'manggis',
  'rambutan',
  'nanas',
  'jeruk',
  'tembakau',
  'kapas',
  'sagu',
];
const KOMODITAS_LAINNYA = '__lainnya__';

export default function PlotForm({
  position,
  gpsLoading,
  gpsError,
  accuracyM,
  onUseGps,
  onSubmit,
  submitting,
  bare = false,
}: PlotFormProps) {
  const [nama, setNama] = useState('');
  const [desa, setDesa] = useState('');
  const [telepon, setTelepon] = useState('');
  const [komoditas, setKomoditas] = useState('kopi');
  const [komoditasLainnya, setKomoditasLainnya] = useState('');
  const [email, setEmail] = useState('');

  const isLainnya = komoditas === KOMODITAS_LAINNYA;
  const komoditasFinal = isLainnya ? komoditasLainnya.trim() : komoditas;
  const canSubmit =
    Boolean(position) && nama.trim().length > 0 && komoditasFinal.length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      nama: nama.trim(),
      desa: desa.trim(),
      telepon: telepon.trim(),
      komoditas: komoditasFinal,
      email: email.trim(),
    });
    setNama('');
    setDesa('');
    setTelepon('');
    setKomoditas('kopi');
    setKomoditasLainnya('');
    setEmail('');
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
          <p className="text-sm text-slate-400">Tap peta atau pakai GPS.</p>
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
          onChange={(e) => setKomoditas(e.target.value)}
          className="mt-1 w-full text-base py-2"
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
