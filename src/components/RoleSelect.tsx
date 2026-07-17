import { useEffect, useRef, useState } from 'react';
import type { Role } from '../types';

interface RoleOption {
  role: Role;
  label: string;
  description: string;
}

const OPTIONS: RoleOption[] = [
  { role: 'agen', label: 'Agen', description: 'Petugas lapangan — data kebun & consent' },
  { role: 'petani', label: 'Petani', description: 'Lihat paspor data & unduh PDF' },
  { role: 'eksportir', label: 'Eksportir', description: 'Pantau data petani lintas-agen' },
];

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
}

export default function RoleSelect({ value, onChange }: RoleSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = OPTIONS.find((o) => o.role === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-left hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-colors cursor-pointer"
      >
        <span>
          <span className="block text-sm font-semibold text-slate-800">{selected.label}</span>
          <span className="block text-xs text-slate-500 mt-0.5">{selected.description}</span>
        </span>
        <span
          aria-hidden
          className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          {OPTIONS.map((option) => (
            <li key={option.role} role="option" aria-selected={option.role === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.role);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  option.role === value ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{option.description}</span>
                </span>
                {option.role === value && (
                  <span aria-hidden className="text-brand-800 shrink-0">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
