import type { InputHTMLAttributes } from 'react';

export default function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`rounded-md border border-slate-300 px-3 py-2 ${className}`} {...rest} />;
}
