import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  IdCard,
  LayoutDashboard,
  LogOut,
  Navigation,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Role } from '../context/AppContext';
import OfflineIndicator from './OfflineIndicator';

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string }>;
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

// Rute anak yang belum tentu punya item sidebar sendiri (mis. halaman "create"/"detail"
// yang diakses lewat tombol, bukan link sidebar) — breadcrumb tetap perlu label yang
// tepat, bukan cuma nama grup sidebar terdekat.
const EXTRA_CRUMBS: { test: RegExp; label: string }[] = [
  { test: /^\/agen\/tambah$/, label: 'Tambah Plot' },
  { test: /^\/agen\/plot\//, label: 'Detail Plot' },
];

const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  agen: [
    {
      heading: 'Lapangan',
      items: [
        { label: 'Ringkasan', to: '/agen', icon: LayoutDashboard },
        { label: 'Data Petani', to: '/agen/petani', icon: Users },
        { label: 'Harga Referensi', to: '/agen/harga', icon: TrendingUp },
      ],
    },
  ],
  petani: [
    {
      heading: 'Akun',
      items: [{ label: 'Portal Saya', to: '/petani', icon: IdCard }],
    },
  ],
  eksportir: [
    {
      heading: 'Monitoring',
      items: [
        { label: 'Dashboard', to: '/eksportir', icon: BarChart3 },
        { label: 'Petani Terdekat', to: '/eksportir/terdekat', icon: Navigation },
        { label: 'Harga Referensi', to: '/eksportir/harga', icon: TrendingUp },
      ],
    },
  ],
};

function useOutsideClick(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

function ProfileMenu({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-brand-800 text-white grid place-items-center text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        {ROLE_LABEL[role].slice(0, 1)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[11px] text-slate-400">Masuk sebagai</p>
            <p className="text-sm font-semibold text-slate-800">{ROLE_LABEL[role]}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

interface DashboardShellProps {
  currentRole: Role;
  onGantiRole: () => void;
  children: ReactNode;
}

export default function DashboardShell({ currentRole, onGantiRole, children }: DashboardShellProps) {
  const location = useLocation();
  const groups = NAV_BY_ROLE[currentRole];
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const allItems = groups.flatMap((g) => g.items);
  const matchedItem = allItems
    .filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const extraCrumb = EXTRA_CRUMBS.find((c) => c.test.test(location.pathname));
  const activeLabel = extraCrumb?.label ?? matchedItem?.label ?? ROLE_LABEL[currentRole];

  const toggleGroup = (heading: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [heading]: !prev[heading] }));

  return (
    <div className="font-dashboard h-screen flex flex-col bg-white text-slate-900 overflow-hidden">
      <div className="h-14 flex border-b border-slate-200 shrink-0">
        <div className="w-60 shrink-0 flex items-center gap-2 px-5 border-r border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/JejakHijau.png" alt="JejakHijau" className="w-7 h-7 shrink-0 object-contain" />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-900 leading-tight truncate">
                JejakHijau
              </span>
              <span className="block text-[11px] text-slate-400 leading-tight truncate">
                {ROLE_LABEL[currentRole]}
              </span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between px-8">
          <p className="text-[13px] text-slate-400 flex items-center gap-1.5 min-w-0">
            <span className="text-slate-500 truncate">{ROLE_LABEL[currentRole]}</span>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-slate-800 font-medium truncate">{activeLabel}</span>
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <OfflineIndicator />
            <ProfileMenu role={currentRole} onLogout={onGantiRole} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <aside className="no-print w-60 shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-3 pt-4 pb-4 space-y-4">
            {groups.map((group) => {
              const collapsed = collapsedGroups[group.heading];
              return (
                <div key={group.heading}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.heading)}
                    className="w-full flex items-center justify-between px-2 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide"
                  >
                    {group.heading}
                    {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {!collapsed && (
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = item.to === matchedItem?.to;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                              active
                                ? 'bg-brand-50 text-brand-800 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <Icon size={16} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
