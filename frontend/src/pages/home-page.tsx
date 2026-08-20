import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { EventCard } from '../components/event-card';
import { getPublishedEvents } from '../services/event-service';
import type { EventCategory, EventFilters } from '../types/event';
import { eventCategoryLabels } from '../utils/event-formatters';

export function HomePage() {
  const [filters, setFilters] = useState<EventFilters>({});
  const eventsQuery = useQuery({
    queryKey: ['events', 'public', filters],
    queryFn: () => getPublishedEvents(filters),
  });

  const updateFilter = (name: keyof EventFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_35%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Eventos para viver e lembrar
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Encontre sua próxima experiência.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Descubra shows, cinema, teatro e encontros publicados por organizadores verificados.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14" aria-labelledby="catalog-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Catálogo
            </p>
            <h2 id="catalog-title" className="mt-2 text-3xl font-semibold text-white">
              Próximos eventos
            </h2>
          </div>
          <p className="text-sm text-slate-400">Ordenados pela data mais próxima</p>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block">Buscar</span>
            <input
              type="search"
              value={filters.search ?? ''}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Nome do evento"
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block">Categoria</span>
            <select
              value={filters.category ?? ''}
              onChange={(event) =>
                updateFilter('category', event.target.value as EventCategory | '')
              }
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            >
              <option value="">Todas</option>
              {Object.entries(eventCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block">Cidade</span>
            <input
              value={filters.city ?? ''}
              onChange={(event) => updateFilter('city', event.target.value)}
              placeholder="Ex.: São Paulo"
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block">Data</span>
            <input
              type="date"
              value={filters.date ?? ''}
              onChange={(event) => updateFilter('date', event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        {eventsQuery.isPending && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Carregando eventos">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {eventsQuery.isError && (
          <div role="alert" className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6 text-rose-100">
            Não foi possível carregar os eventos. Confirme se a API está em execução.
          </div>
        )}

        {eventsQuery.isSuccess && eventsQuery.data.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <h3 className="text-xl font-semibold text-white">Nenhum evento encontrado</h3>
            <p className="mt-2 text-slate-400">Tente remover ou alterar os filtros.</p>
          </div>
        )}

        {eventsQuery.isSuccess && eventsQuery.data.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsQuery.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
