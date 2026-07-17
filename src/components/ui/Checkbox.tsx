import React from 'react';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<'input'> {}

export default function Checkbox({ className = '', ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`w-4 h-4 text-brand-800 border-slate-300 rounded focus:ring-brand-500 cursor-pointer ${className}`}
      {...props}
    />
  );
}
