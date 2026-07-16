import type { ComponentPropsWithoutRef, ElementType } from 'react';

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

// Polymorphic supaya bisa dipakai sebagai <form> (mis. PlotForm) tanpa kehilangan
// styling card standar (bg-white rounded-lg border border-slate-200 p-4).
export default function Card<T extends ElementType = 'div'>({
  as,
  className = '',
  ...rest
}: CardProps<T>) {
  const Component = as ?? 'div';
  return <Component className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`} {...rest} />;
}
