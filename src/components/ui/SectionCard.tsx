import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({ title, description, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
