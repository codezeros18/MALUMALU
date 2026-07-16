import type { SelectHTMLAttributes } from 'react';

export default function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`rounded-md border border-slate-300 px-2 py-1 ${className}`} {...rest} />;
}
