import { useCallback, useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { addTransaksi, listTransaksi } from '../lib/db';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import { getReferencePrice, MIN_TXN_COUNT, type ReferencePrice } from '../lib/harga/aggregate';
import { KOMODITAS_OPTIONS, KOMODITAS_LAINNYA } from '../lib/komoditas';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import type { Transaksi } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ===== Rekam Transaksi (Agen saja) =====

function RekamTransaksiForm({ onRecorded }: { onRecorded: () => void }) {
  const [komoditas, setKomoditas] = useState('kopi');
  const [komoditasLainnya, setKomoditasLainnya] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [grade, setGrade] = useState('');
  const [hargaPerKg, setHargaPerKg] = useState('');
  const [tanggal, setTanggal] = useState(todayIso());
  const [verified, setVerified] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLainnya = komoditas === KOMODITAS_LAINNYA;
  const komoditasFinal = isLainnya ? komoditasLainnya.trim() : komoditas;
  const hargaNum = Number(hargaPerKg);
  const canSubmit =
    komoditasFinal.length > 0 && wilayah.trim().length > 0 && hargaNum > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await addTransaksi({
        komoditas: komoditasFinal,
        wilayah: wilayah.trim(),
        grade: grade.trim(),
        hargaPerKg: hargaNum,
        tanggal,
        verified,
      });
      setMessage('Transaksi tersimpan lokal — akan tersinkron otomatis saat online.');
      setWilayah('');
      setGrade('');
      setHargaPerKg('');
      onRecorded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Rekam Transaksi"
      description="Catat transaksi nyata yang terjadi di lapangan — jadi dasar harga referensi bersama, bukan angka sepihak."
    >
      <div className="space-y-3">
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
          <label className="block text-sm font-medium text-slate-700">Wilayah *</label>
          <Input
            value={wilayah}
            onChange={(e) => setWilayah(e.target.value)}
            className="mt-1 w-full text-base"
            placeholder="Contoh: Pangalengan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Grade</label>
          <Input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="mt-1 w-full text-base"
            placeholder="Contoh: Grade A / cherry merah"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Harga per kg (Rp) *</label>
          <Input
            type="number"
            min="0"
            value={hargaPerKg}
            onChange={(e) => setHargaPerKg(e.target.value)}
            className="mt-1 w-full text-base"
            placeholder="Contoh: 62000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tanggal transaksi *</label>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="mt-1 w-full text-base"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          Saya konfirmasi transaksi ini nyata terjadi (bukan estimasi)
        </label>

        <Button onClick={handleSubmit} disabled={!canSubmit} fullWidth size="md" className="font-semibold">
          {saving ? 'Menyimpan…' : 'Simpan Transaksi'}
        </Button>

        {message && <p className="text-xs text-brand-800">{message}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </SectionCard>
  );
}

function RiwayatTransaksi({ items }: { items: Transaksi[] }) {
  return (
    <SectionCard title={`Transaksi Tercatat di Perangkat Ini (${items.length})`}>
      {items.length === 0 ? (
        <EmptyState message="Belum ada transaksi tercatat di perangkat ini." />
      ) : (
        <ul className="space-y-1.5">
          {items
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-xs border border-slate-100 rounded px-2 py-1.5"
              >
                <span className="capitalize">
                  {t.komoditas} · {t.wilayah}
                  {t.grade ? ` · ${t.grade}` : ''} · {t.tanggal}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="font-medium text-slate-700">{formatRp(t.hargaPerKg)}/kg</span>
                  <Badge tone={t.syncStatus === 'synced' ? 'synced' : 'pending'}>
                    {t.syncStatus === 'synced' ? 'Tersinkron' : 'Tersimpan lokal'}
                  </Badge>
                </span>
              </li>
            ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ===== Cek Harga Referensi (Agen + Eksportir) =====

function CekHargaReferensi() {
  const [komoditas, setKomoditas] = useState('kopi');
  const [komoditasLainnya, setKomoditasLainnya] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [grade, setGrade] = useState('');
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<ReferencePrice | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isLainnya = komoditas === KOMODITAS_LAINNYA;
  const komoditasFinal = isLainnya ? komoditasLainnya.trim() : komoditas;

  const handleCheck = async () => {
    if (!komoditasFinal || !wilayah.trim()) return;
    setChecking(true);
    setChecked(false);
    setError(null);
    try {
      const rows = await supabaseBackend.fetchAll('transaksi');
      const transaksi = rows.map((r) => fromSupabaseRow<Transaksi>(r));
      const ref = getReferencePrice(transaksi, komoditasFinal, wilayah.trim(), grade.trim());
      setResult(ref);
      setMatchedCount(
        transaksi.filter(
          (t) =>
            t.verified &&
            t.komoditas.trim().toLowerCase() === komoditasFinal.trim().toLowerCase() &&
            t.wilayah.trim().toLowerCase() === wilayah.trim().toLowerCase() &&
            t.grade.trim().toLowerCase() === grade.trim().toLowerCase(),
        ).length,
      );
      setChecked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data referensi (perlu koneksi internet).');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SectionCard
      title="Cek Harga Referensi"
      description="Agregat transparan dari transaksi terverifikasi platform — bukan angka sepihak."
    >
      <div className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
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
            <label className="block text-sm font-medium text-slate-700">Wilayah *</label>
            <Input
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value)}
              className="mt-1 w-full text-base"
              placeholder="Contoh: Pangalengan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Grade</label>
            <Input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full text-base"
              placeholder="Contoh: Grade A"
            />
          </div>
        </div>

        <Button
          onClick={handleCheck}
          disabled={checking || !komoditasFinal || !wilayah.trim()}
          fullWidth
          size="md"
        >
          {checking ? 'Memuat…' : 'Cek Harga'}
        </Button>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {checked && !error && !result && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Data belum cukup — baru {matchedCount} transaksi terverifikasi untuk kombinasi ini
            (butuh minimal {MIN_TXN_COUNT}). Belum ditampilkan angka supaya tidak menyesatkan.
          </div>
        )}

        {checked && !error && result && (
          <div className="rounded-lg border border-brand-400 bg-brand-50 px-4 py-3 space-y-1">
            <p className="text-xs text-brand-800 font-semibold uppercase tracking-wide">
              Agregat Platform
            </p>
            <p className="text-lg font-bold text-brand-800">
              {formatRp(result.low)} - {formatRp(result.high)}/kg
            </p>
            <p className="text-sm text-brand-800">Rata-rata: {formatRp(result.avg)}/kg</p>
            <p className="text-xs text-slate-500">
              Berdasarkan {result.txnCount} transaksi terverifikasi.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function HargaReferensi() {
  const { currentRole } = useAppContext();
  const isAgen = currentRole === 'agen';
  const [ownTransaksi, setOwnTransaksi] = useState<Transaksi[]>([]);

  const refreshOwn = useCallback(async () => {
    try {
      setOwnTransaksi(await listTransaksi());
    } catch (err) {
      console.error('[HargaReferensi] gagal memuat transaksi lokal', err);
    }
  }, []);

  useEffect(() => {
    if (isAgen) refreshOwn();
  }, [isAgen, refreshOwn]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        backTo={isAgen ? '/agen' : '/eksportir'}
        backLabel={isAgen ? 'Kembali ke Ringkasan' : 'Kembali ke Dashboard'}
        icon={TrendingUp}
        title="Harga Referensi"
        description="Agregat transparan dari transaksi terverifikasi — melindungi petani dari harga sepihak."
      />

      <div className="space-y-6">
        {isAgen && (
          <div className="grid lg:grid-cols-2 gap-6">
            <RekamTransaksiForm onRecorded={refreshOwn} />
            <RiwayatTransaksi items={ownTransaksi} />
          </div>
        )}

        <CekHargaReferensi />

        {!isAgen && (
          <Card className="text-xs text-slate-400">
            Perekaman transaksi dilakukan Agen di lapangan. Halaman ini menampilkan agregat
            transparan hasil transaksi yang mereka catat — bukan angka yang eksportir tentukan
            sendiri.
          </Card>
        )}
      </div>
    </div>
  );
}
