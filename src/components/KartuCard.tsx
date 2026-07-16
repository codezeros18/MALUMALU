import type { Kartu } from '../types';

interface KartuCardProps {
  kartu: Kartu;
}

const TIER_LABEL: Record<Kartu['tier'], string> = {
  lokal: 'Lokal / Program',
  'export-ready': 'Export-Ready',
};

const STDB_LABEL: Record<Kartu['stdbStatus'], string> = {
  'stdb-ready': 'STDB Ready',
  'belum-lengkap': 'Belum Lengkap',
};

export default function KartuCard({ kartu }: KartuCardProps) {
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
        {kartu.alasan.map((alasan) => (
          <li key={alasan}>{alasan}</li>
        ))}
      </ul>

      <p className="text-[11px] text-slate-400">
        Peta JRC ~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca hutan).
        Penandaan berbasis titik (point-primary), GPS bisa meleset 3–11m.
      </p>
    </div>
  );
}
