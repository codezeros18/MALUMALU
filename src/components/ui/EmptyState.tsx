import React from 'react';

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center py-6 px-4 bg-slate-50 border border-slate-150 rounded-lg">
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
}
