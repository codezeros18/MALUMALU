import type { InputHTMLAttributes } from 'react';

export default function Checkbox({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={className} {...rest} />;
}
