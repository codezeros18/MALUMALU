import React from 'react';

export interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {}

export default function Select({ children, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
