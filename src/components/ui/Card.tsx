import React from 'react';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  as?: any;
}

export default function Card({ children, className = '', as: Component = 'div', ...props }: CardProps) {
  return (
    <Component
      className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
