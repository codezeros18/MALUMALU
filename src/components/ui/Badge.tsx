import type { ReactNode } from 'react';

export type BadgeTone =
  | 'aman'
  | 'perlu-audit'
  | 'berisiko'
  | 'alert'
  | 'synced'
  | 'pending'
  | 'neutral'
  | 'demo';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

// Satu sumber warna status dipakai di semua dashboard (Agen/Eksportir/Petani) — lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 4 (Golden Rules: consistency & standards).
const TONE_CLASSES: Record<BadgeTone, string> = {
  aman: 'bg-green-100 text-green-800',
  synced: 'bg-green-100 text-green-800',
  'perlu-audit': 'bg-amber-100 text-amber-800',
  demo: 'bg-amber-100 text-amber-800',
  berisiko: 'bg-red-100 text-red-800',
  alert: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-700',
};

export default function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
