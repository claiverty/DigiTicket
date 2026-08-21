import { CalendarX2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className = 'mt-10',
}: EmptyStateProps) {
  return (
    <div className={`${className} rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center ${compact ? 'py-7' : 'py-12'}`}>
      <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><CalendarX2 size={20} /></div>
      <h2 className={`${compact ? 'mt-3 text-base' : 'mt-4 text-xl'} font-bold text-slate-950`}>{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
