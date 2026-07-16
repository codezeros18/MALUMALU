interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return <p className="text-xs text-slate-400 text-center py-4">{message}</p>;
}
