import { useState } from 'react';
import { commitKartu } from '../lib/hashchain';
import { deforestasiStatusToRiskLevel, getMitigationGuidance } from '../lib/geospatial';
import Card from './ui/Card';
import Button from './ui/Button';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Badge from './ui/Badge';
import type { Kartu, Tier, StdbStatus } from '../types';

interface KartuCardProps {
  kartu: Kartu;
  onKartuUpdated?: (kartu: Kartu) => void;
  syncFailed?: boolean; // true kalau ada item syncQueue untuk kartu ini yang gagal (attempts > 0)
  onRetrySync?: () => void;
  readOnly?: boolean; // sembunyikan tombol "Koreksi manual" (dipakai dashboard Eksportir, Sprint 13)
}

const TIER_LABEL: Record<Tier, string> = {
  lokal: 'Lokal / Program',
  'export-ready': 'Export-Ready',
};

const TIER_TONE: Record<Tier, 'aman' | 'neutral'> = {
  lokal: 'neutral',
  'export-ready': 'aman',
};

const STDB_LABEL: Record<StdbStatus, string> = {
  'stdb-ready': 'STDB Ready',
  'belum-lengkap': 'Belum Lengkap',
};

const STDB_TONE: Record<StdbStatus, 'synced' | 'perlu-audit'> = {
  'stdb-ready': 'synced',
  'belum-lengkap': 'perlu-audit',
};

const TIER_OPTIONS: Tier[] = ['lokal', 'export-ready'];
const STDB_OPTIONS: StdbStatus[] = ['stdb-ready', 'belum-lengkap'];

export default function KartuCard({
  kartu,
  onKartuUpdated,
  syncFailed,
  onRetrySync,
  readOnly = false,
}: KartuCardProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTier, setOverrideTier] = useState<Tier>(kartu.tier);
  const [overrideStdb, setOverrideStdb] = useState<StdbStatus>(kartu.stdbStatus);
  const [alasanKoreksi, setAlasanKoreksi] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showMitigasi, setShowMitigasi] = useState(false);
  const [catatanMitigasi, setCatatanMitigasi] = useState(kartu.mitigasiRisiko ?? '');
  const [savingMitigasi, setSavingMitigasi] = useState(false);
  const [mitigasiError, setMitigasiError] = useState<string | null>(null);

  const riskLevel = deforestasiStatusToRiskLevel(kartu.deforestasi);
  const guidance = kartu.deforestasi !== 'aman' ? getMitigationGuidance(riskLevel) : null;

  const handleSaveMitigasi = async () => {
    setSavingMitigasi(true);
    setMitigasiError(null);
    try {
      const updated: Kartu = {
        ...kartu,
        mitigasiRisiko: catatanMitigasi.trim() || undefined,
        mitigasiRisikoUpdatedAt: Date.now(),
      };
      const committed = await commitKartu(updated);
      onKartuUpdated?.(committed);
      setShowMitigasi(false);
    } catch (err) {
      setMitigasiError(err instanceof Error ? err.message : 'Gagal menyimpan catatan mitigasi.');
    } finally {
      setSavingMitigasi(false);
    }
  };

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
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge tone={TIER_TONE[kartu.tier]}>{TIER_LABEL[kartu.tier]}</Badge>
        <Badge tone={STDB_TONE[kartu.stdbStatus]}>{STDB_LABEL[kartu.stdbStatus]}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone={syncFailed ? 'alert' : kartu.syncStatus === 'synced' ? 'synced' : 'pending'}>
          {syncFailed ? 'Gagal sinkron' : kartu.syncStatus === 'synced' ? 'Tersinkron' : 'Tersimpan lokal'}
        </Badge>
        {syncFailed && onRetrySync && (
          <button type="button" onClick={onRetrySync} className="text-[10px] text-brand-800 underline">
            Coba lagi
          </button>
        )}
      </div>

      <p className="text-sm text-slate-600 flex items-center gap-2">
        Status deforestasi: <Badge tone={kartu.deforestasi}>{kartu.deforestasi}</Badge>
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

      {guidance && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">{guidance.title}</p>
          <p className="text-xs text-slate-600">{guidance.summary}</p>
          <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
            {guidance.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400">{guidance.disclaimer}</p>

          {kartu.mitigasiRisiko && (
            <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5">
              <p className="text-[11px] font-medium text-slate-500">Catatan mitigasi tercatat:</p>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{kartu.mitigasiRisiko}</p>
            </div>
          )}

          {!readOnly && !showMitigasi && (
            <button type="button" onClick={() => setShowMitigasi(true)} className="text-xs text-brand-800 underline">
              {kartu.mitigasiRisiko ? 'Perbarui catatan mitigasi' : 'Catat Tindakan Mitigasi'}
            </button>
          )}

          {!readOnly && showMitigasi && (
            <div className="space-y-2">
              <Textarea
                value={catatanMitigasi}
                onChange={(e) => setCatatanMitigasi(e.target.value)}
                placeholder="Contoh: sudah dilakukan ground-truthing 12/07, rencana reboisasi area tepi lahan bulan depan…"
                className="w-full text-xs"
                rows={3}
              />
              {mitigasiError && <p className="text-xs text-red-600">{mitigasiError}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSaveMitigasi} disabled={savingMitigasi} fullWidth size="sm" className="flex-1">
                  {savingMitigasi ? 'Menyimpan…' : 'Simpan Catatan'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowMitigasi(false);
                    setCatatanMitigasi(kartu.mitigasiRisiko ?? '');
                  }}
                  disabled={savingMitigasi}
                  size="sm"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!readOnly && !showOverride && (
        <button type="button" onClick={openOverride} className="text-xs text-brand-800 underline">
          Koreksi manual
        </button>
      )}

      {!readOnly && showOverride && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-medium text-slate-600">Koreksi manual (keputusan akhir petugas)</p>
          <div className="flex gap-2">
            <Select
              value={overrideTier}
              onChange={(e) => setOverrideTier(e.target.value as Tier)}
              className="flex-1 text-xs"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABEL[t]}
                </option>
              ))}
            </Select>
            <Select
              value={overrideStdb}
              onChange={(e) => setOverrideStdb(e.target.value as StdbStatus)}
              className="flex-1 text-xs"
            >
              {STDB_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STDB_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            value={alasanKoreksi}
            onChange={(e) => setAlasanKoreksi(e.target.value)}
            placeholder="Alasan koreksi (wajib, untuk jejak audit)"
            className="w-full text-xs"
            rows={2}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSaveOverride} disabled={saving} fullWidth size="sm" className="flex-1">
              {saving ? 'Menyimpan…' : 'Simpan Koreksi'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowOverride(false)}
              disabled={saving}
              size="sm"
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
