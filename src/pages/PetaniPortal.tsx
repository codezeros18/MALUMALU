import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { listPetani, listPlotByPetani, getKartuByPlot } from '../lib/db';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import { useAppContext } from '../context/AppContext';
import PassportCard from '../components/PassportCard';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import ConsentPanel from '../components/ConsentPanel';
import DocumentUpload from '../components/DocumentUpload';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import type { Petani, Kartu, Plot } from '../types';

interface KartuEntry {
  kartu: Kartu;
  plot?: Plot;
}

type ViewMode = 'paspor' | 'dokumen';

export default function PetaniPortal() {
  const navigate = useNavigate();
  const { setRole } = useAppContext();

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petani, setPetani] = useState<Petani | null>(null);
  const [entries, setEntries] = useState<KartuEntry[]>([]);
  const [view, setView] = useState<ViewMode>('paspor');

  const handleKeluar = () => {
    setRole(null);
    navigate('/masuk');
  };

  const handleReset = () => {
    setEmail('');
    setError(null);
    setPetani(null);
    setEntries([]);
    setView('paspor');
  };

  const handleSearch = async () => {
    const query = email.trim().toLowerCase();
    if (!query) return;
    setSearching(true);
    setError(null);
    setPetani(null);
    setEntries([]);
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
      const kartuEntries: KartuEntry[] = [];
      for (const plot of plots) {
        const kartu = await getKartuByPlot(plot.id);
        if (kartu) kartuEntries.push({ kartu, plot });
      }
      setEntries(kartuEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari data.');
    } finally {
      setSearching(false);
    }
  };

  if (petani) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="no-print max-w-lg mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={15} />
            Cari data lain
          </button>
          <button
            type="button"
            onClick={handleKeluar}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            <LogOut size={13} />
            Keluar
          </button>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
          <div className="no-print flex items-center justify-between gap-3">
            <div className="inline-flex bg-slate-100 rounded-lg p-1 text-sm">
              <button
                type="button"
                onClick={() => setView('paspor')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  view === 'paspor' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Paspor Digital
              </button>
              <button
                type="button"
                onClick={() => setView('dokumen')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  view === 'dokumen' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Dokumen Lengkap
              </button>
            </div>

            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              {view === 'paspor' ? 'Unduh sebagai Paspor' : 'Unduh sebagai Dokumen'}
            </Button>
          </div>

          {entries.length === 0 ? (
            <EmptyState message="Belum ada kartu/plot yang tersedia untuk petani ini di perangkat ini." />
          ) : view === 'paspor' ? (
            <div className="space-y-4">
              {entries.map(({ kartu, plot }) => (
                <PassportCard key={kartu.id} petani={petani} plot={plot} kartu={kartu} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-600">Petani</p>
                <p className="text-lg font-semibold text-brand-800">{petani.nama}</p>
                {petani.desa && <p className="text-xs text-slate-500">{petani.desa}</p>}
              </div>
              <DocumentUpload petaniId={petani.id} readOnly />
              {entries.map(({ kartu }) => (
                <div key={kartu.id} className="space-y-4">
                  <KartuCard kartu={kartu} readOnly />
                  <HashChainViewer refreshSignal={kartu.hashChainRef} readOnly />
                  <ConsentPanel kartuId={kartu.id} mode="petani" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <button
        type="button"
        onClick={handleKeluar}
        className="absolute top-5 right-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
      >
        <LogOut size={13} />
        Keluar
      </button>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Paspor Data Anda
          </h1>
          <p className="text-slate-500 mt-3 mb-10">
            Masukkan email yang terdaftar oleh Agen saat registrasi — data kebun dan riwayat
            akses Anda akan tampil, sepenuhnya milik Anda.
          </p>

          <div className="space-y-3 text-left">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 mb-1.5">
                Email terdaftar
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="email@contoh.com"
                className="w-full bg-slate-50 px-4 py-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !email.trim()}
              className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-brand-400 to-brand-800 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {searching ? 'Mencari…' : 'Cari Data Saya'}
              <span
                aria-hidden
                className="w-7 h-7 rounded-full bg-white/20 grid place-items-center shrink-0"
              >
                →
              </span>
            </button>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
