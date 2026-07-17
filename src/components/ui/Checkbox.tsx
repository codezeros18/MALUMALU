import type { InputHTMLAttributes } from 'react';

export default function Checkbox({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={`w-4 h-4 rounded border-slate-300 accent-brand-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${className}`}
      {...rest}
    />
  );
}
