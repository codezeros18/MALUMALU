import type { TextareaHTMLAttributes } from 'react';

export default function Textarea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-y ${className}`}
      {...rest}
    />
  );
}
