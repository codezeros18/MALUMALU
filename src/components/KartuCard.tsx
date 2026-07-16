import { useState } from 'react';
import { commitKartu } from '../lib/hashchain';
import type { Kartu, Tier, StdbStatus } from '../types';

interface KartuCardProps {
  kartu: Kartu;
  onKartuUpdated?: (kartu: Kartu) => void;
}

const TIER_LABEL: Record<Tier, string> = {
  lokal: 'Lokal / Program',
  'export-ready': 'Export-Ready',
};

const STDB_LABEL: Record<StdbStatus, string> = {
  'stdb-ready': 'STDB Ready',
  'belum-lengkap': 'Belum Lengkap',
};

const TIER_OPTIONS: Tier[] = ['lokal', 'export-ready'];
const STDB_OPTIONS: StdbStatus[] = ['stdb-ready', 'belum-lengkap'];

export default function KartuCard({ kartu, onKartuUpdated }: KartuCardProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTier, setOverrideTier] = useState<Tier>(kartu.tier);
  const [overrideStdb, setOverrideStdb] = useState<StdbStatus>(kartu.stdbStatus);
  const [alasanKoreksi, setAlasanKoreksi] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openOverride = () => {
    setOverrideTier(kartu.tier);
    setOverrideStdb(kartu.stdbStatus);
    setAlasanKoreksi('');
    setError(null);
    setShowOverride(true);
  };

  const handleSaveOverride = async () => {
    if (!alasanKoreksi.trim()) {
      setError('Alasan koreksi wajib diisi (untuk jejak audit).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated: Kartu = {
        ...kartu,
        tier: overrideTier,
        stdbStatus: overrideStdb,
        alasan: [...kartu.alasan, `Dikoreksi manual oleh petugas: ${alasanKoreksi.trim()}`],
      };
      const committed = await commitKartu(updated);
      onKartuUpdated?.(committed);
      setShowOverride(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan koreksi manual.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            kartu.tier === 'export-ready'
              ? 'bg-brand-100 text-brand-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {TIER_LABEL[kartu.tier]}
        </span>
        <span className="text-xs text-slate-500">{STDB_LABEL[kartu.stdbStatus]}</span>
      </div>

      <p className="text-sm text-slate-600">
        Status deforestasi: <strong>{kartu.deforestasi}</strong>
      </p>

      <ul className="text-xs text-slate-500 list-disc list-inside space-y-0.5">
        {kartu.alasan.map((alasan, i) => (
          <li key={`${i}-${alasan}`}>{alasan}</li>
        ))}
      </ul>

      <p className="text-[11px] text-slate-400">
        Peta JRC ~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca hutan).
        Penandaan berbasis titik (point-primary), GPS bisa meleset 3–11m.
      </p>

      {!showOverride && (
        <button
          type="button"
          onClick={openOverride}
          className="text-xs text-brand-800 underline"
        >
          Koreksi manual
        </button>
      )}

      {showOverride && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-medium text-slate-600">Koreksi manual (keputusan akhir petugas)</p>
          <div className="flex gap-2">
            <select
              value={overrideTier}
              onChange={(e) => setOverrideTier(e.target.value as Tier)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABEL[t]}
                </option>
              ))}
            </select>
            <select
              value={overrideStdb}
              onChange={(e) => setOverrideStdb(e.target.value as StdbStatus)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              {STDB_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STDB_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={alasanKoreksi}
            onChange={(e) => setAlasanKoreksi(e.target.value)}
            placeholder="Alasan koreksi (wajib, untuk jejak audit)"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            rows={2}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveOverride}
              disabled={saving}
              className="flex-1 py-2 rounded-md bg-brand-800 text-white text-xs font-medium disabled:opacity-50"
            >
              {saving ? 'Menyimpan…' : 'Simpan Koreksi'}
            </button>
            <button
              type="button"
              onClick={() => setShowOverride(false)}
              disabled={saving}
              className="px-3 py-2 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
