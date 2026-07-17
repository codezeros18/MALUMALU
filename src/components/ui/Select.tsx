import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

// Sama seperti <select> native (menerima <option value="x">Label</option> sebagai
// children) supaya semua pemanggil lama tidak perlu ubah struktur — tapi dirender
// sebagai dropdown kustom (button + listbox) senada dengan RoleSelect.tsx di halaman
// Login, bukan <select> bawaan browser yang polosan.
function extractOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) return [];
    const { value, children: label } = child.props;
    if (value === undefined) return [];
    return [{ value: String(value), label }];
  });
}

export default function Select({ value, onChange, children, className = '', disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = extractOptions(children);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="truncate">{selected?.label ?? '—'}</span>
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
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-brand-50 text-brand-800 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
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
