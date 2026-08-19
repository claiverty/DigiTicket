import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a className="text-lg font-semibold tracking-tight" href="/">
            digi<span className="text-emerald-400">ticket</span>
          </a>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Fase 1 · Fundação
          </span>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
