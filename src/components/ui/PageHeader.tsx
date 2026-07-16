import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  backTo: string;
  backLabel: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  backTo,
  backLabel,
  icon: Icon,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
      >
        <ArrowLeft size={15} />
        {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-lg bg-brand-50 text-brand-800 grid place-items-center">
            <Icon size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
