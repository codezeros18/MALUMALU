import type { TextareaHTMLAttributes } from 'react';

export default function Textarea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`rounded-md border border-slate-300 px-2 py-1 ${className}`} {...rest} />;
}
