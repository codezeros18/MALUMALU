import React from 'react';

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {}

export default function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${className}`}
      {...props}
    />
  );
}
