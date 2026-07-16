import { useState } from 'react';
import { listPetani, listPlotByPetani, getKartuByPlot } from '../lib/db';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import ConsentPanel from '../components/ConsentPanel';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import type { Petani, Kartu } from '../types';

export default function PetaniPortal() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petani, setPetani] = useState<Petani | null>(null);
  const [kartuList, setKartuList] = useState<Kartu[]>([]);

  const handleSearch = async () => {
    const query = email.trim().toLowerCase();
    if (!query) return;
    setSearching(true);
    setSearched(true);
    setError(null);
    setPetani(null);
    setKartuList([]);
    try {
      // Cari lokal dulu (device ini) — kalau tidak ketemu, coba data sinkron dari agen
      // lain via Supabase. Plot/Kartu tetap diambil dari IndexedDB LOKAL (lihat catatan
      // di bawah) — kalau petani ditemukan hanya lewat data remote, plot/kartu-nya
      // mungkin belum tersedia di device ini (batasan Phase A, bukan bug).
      const localMatches = await listPetani();
      let match = localMatches.find((p) => p.email?.trim().toLowerCase() === query) ?? null;

      if (!match) {
        try {
          const remoteRows = await supabaseBackend.fetchAll('petani');
          const remoteMatches = remoteRows.map((r) => fromSupabaseRow<Petani>(r));
          match = remoteMatches.find((p) => p.email?.trim().toLowerCase() === query) ?? null;
        } catch (err) {
          console.error('[PetaniPortal] pencarian data sinkron gagal (lanjut pakai hasil lokal)', err);
        }
      }

      if (!match) {
        setError('Tidak ditemukan data petani dengan email tersebut.');
        return;
      }

      setPetani(match);

      const plots = await listPlotByPetani(match.id);
      const kartus: Kartu[] = [];
      for (const plot of plots) {
        const kartu = await getKartuByPlot(plot.id);
        if (kartu) kartus.push(kartu);
      }
      setKartuList(kartus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari data.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="no-print rounded-md bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 text-xs">
        Mode demo — akses berdasarkan email tanpa verifikasi identitas sungguhan. Bukan
        portal produksi aman.
      </div>

      <div className="no-print">
        <h1 className="text-xl font-bold text-brand-800">Portal Petani</h1>
        <p className="text-sm text-slate-600">
          Masukkan email yang terdaftar (oleh Agen saat registrasi) untuk melihat paspor
          data Anda.
        </p>
      </div>

      <Card className="no-print space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            className="flex-1 text-sm"
          />
          <Button onClick={handleSearch} disabled={searching || !email.trim()}>
            {searching ? 'Mencari…' : 'Cari data saya'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </Card>

      {searched && !error && petani && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-slate-600">Petani</p>
            <p className="text-lg font-semibold text-brand-800">{petani.nama}</p>
            {petani.desa && <p className="text-xs text-slate-500">{petani.desa}</p>}
          </Card>

          <div className="no-print flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              Unduh sebagai PDF
            </Button>
          </div>

          {kartuList.length === 0 ? (
            <EmptyState message="Belum ada kartu/plot yang tersedia untuk petani ini di perangkat ini." />
          ) : (
            kartuList.map((kartu) => (
              <div key={kartu.id} className="space-y-4">
                <KartuCard kartu={kartu} readOnly />
                <HashChainViewer refreshSignal={kartu.hashChainRef} readOnly />
                <ConsentPanel kartuId={kartu.id} mode="petani" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
