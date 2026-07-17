import React from 'react';

export type BadgeTone =
  | 'aman'
  | 'neutral'
  | 'synced'
  | 'pending'
  | 'perlu-audit'
  | 'alert'
  | 'demo'
  | 'berisiko'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

export default function Badge({ children, tone = 'neutral' }: BadgeProps) {
  const styles = {
    aman: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    synced: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    'perlu-audit': 'bg-amber-100 text-amber-800 border-amber-200',
    alert: 'bg-red-100 text-red-800 border-red-200',
    demo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    berisiko: 'bg-rose-100 text-rose-800 border-rose-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
  };

  const selectedStyle = styles[tone as keyof typeof styles] || styles.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${selectedStyle}`}
    >
      {children}
    </span>
  );
}
