import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '../context/AppContext';
import OfflineIndicator from './OfflineIndicator';

interface NavItem {
  label: string;
  to: string;
  icon: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const ROLE_LABEL: Record<Role, string> = {
  agen: 'Agen',
  petani: 'Petani',
  eksportir: 'Eksportir',
};

const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  agen: [
    {
      heading: 'Lapangan',
      items: [
        { label: 'Peta & Plot', to: '/agen', icon: '📍' },
        { label: 'Data Petani', to: '/agen/petani', icon: '👥' },
      ],
    },
  ],
  petani: [
    {
      heading: 'Akun',
      items: [{ label: 'Portal Saya', to: '/petani', icon: '🪪' }],
    },
  ],
  eksportir: [
    {
      heading: 'Monitoring',
      items: [{ label: 'Dashboard', to: '/eksportir', icon: '📊' }],
    },
  ],
};

interface DashboardShellProps {
  currentRole: Role;
  onGantiRole: () => void;
  children: ReactNode;
}

export default function DashboardShell({ currentRole, onGantiRole, children }: DashboardShellProps) {
  const location = useLocation();
  const groups = NAV_BY_ROLE[currentRole];

  return (
    <div className="font-dashboard min-h-screen flex bg-white text-slate-900">
      <aside className="no-print w-60 shrink-0 border-r border-slate-200 flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 py-5 shrink-0">
          <span className="w-7 h-7 rounded-md bg-brand-800 text-white grid place-items-center text-xs font-bold">
            P
          </span>
          <span className="text-sm font-semibold text-slate-900">Paspor Petani</span>
        </Link>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Masuk sebagai</p>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">{ROLE_LABEL[currentRole]}</p>
        </div>

        <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.heading}>
              <p className="px-2 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-brand-50 text-brand-800 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span aria-hidden className="text-base leading-none">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-slate-100 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span aria-hidden className="text-base leading-none">
              🏠
            </span>
            Beranda
          </Link>
          <button
            type="button"
            onClick={onGantiRole}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span aria-hidden className="text-base leading-none">
              🔁
            </span>
            Ganti Peran
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print border-b border-slate-100 px-8 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Paspor Petani</span>
            <span className="mx-1.5">›</span>
            <span className="text-slate-700 font-medium">{ROLE_LABEL[currentRole]}</span>
          </p>
          <OfflineIndicator />
        </header>

        <main className="flex-1 min-w-0 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
