import { useQuery } from '@tanstack/react-query';
import { getApiHealth } from '../services/health-service';

export function HomePage() {
  const healthQuery = useQuery({ queryKey: ['api-health'], queryFn: getApiHealth });

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-32">
      <div>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Plataforma de eventos
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          A estrutura para vender experiências sem atrito.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          A fundação está pronta: React, NestJS, Prisma e PostgreSQL/Supabase serão
          organizados aqui para o fluxo completo de eventos e ingressos.
        </p>
      </div>

      <aside className="self-center rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-medium text-slate-300">Estado da API</p>
        {healthQuery.isPending && <p className="mt-3 text-slate-400">Verificando conexão…</p>}
        {healthQuery.isSuccess && (
          <div className="mt-3">
            <p className="font-semibold text-emerald-300">API disponível</p>
            <p className="mt-1 text-sm text-slate-400">
              Banco: {healthQuery.data.database === 'configured' ? 'configurado' : 'aguardando configuração'}
            </p>
          </div>
        )}
        {healthQuery.isError && (
          <p className="mt-3 text-sm leading-6 text-amber-300">
            Inicie o backend em <code className="rounded bg-black/30 px-1.5 py-0.5">localhost:3000</code> para confirmar a conexão.
          </p>
        )}
      </aside>
    </section>
  );
}
