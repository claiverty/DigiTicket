interface LoadingStateProps {
  label: string;
  variant?: 'cards' | 'list' | 'details' | 'form';
  count?: number;
  className?: string;
}

export function LoadingState({
  label,
  variant = 'list',
  count = 3,
  className = 'mt-10',
}: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {variant === 'cards' && <CardSkeletons count={count} />}
      {variant === 'list' && <ListSkeletons count={count} />}
      {variant === 'details' && <DetailsSkeleton />}
      {variant === 'form' && <FormSkeleton />}
    </div>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none">
          <div className="aspect-[4/3] bg-slate-100" />
          <div className="space-y-4 p-5">
            <div className="h-3 w-20 rounded bg-blue-100" />
            <div className="h-6 w-4/5 rounded bg-slate-200" />
            <div className="h-4 w-3/5 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeletons({ count }: { count: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 motion-reduce:animate-none">
          <div className="h-3 w-24 rounded bg-blue-100" />
          <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
      <div className="h-72 border-b border-slate-200 bg-slate-100" />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
          <div className="h-4 w-3/4 rounded bg-slate-100" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-14 motion-reduce:animate-none" aria-hidden="true">
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="mt-6 h-10 w-64 rounded bg-slate-200" />
      <div className="mt-10 grid gap-5 rounded-2xl border border-slate-200 bg-white p-8 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-16 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
