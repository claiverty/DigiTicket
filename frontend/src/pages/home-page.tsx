import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/empty-state';
import { EventCard } from '../components/event-card';
import { LoadingState } from '../components/loading-state';
import { getPublishedEvents } from '../services/event-service';
import type { EventFilters } from '../types/event';
import { eventCategoryLabels, formatEventDate } from '../utils/event-formatters';

const heroThemes = [
  { background: '#123b9f', foreground: '#ffffff', accent: '#7dd3fc' },
  { background: '#075985', foreground: '#ffffff', accent: '#bae6fd' },
  { background: '#1d4ed8', foreground: '#ffffff', accent: '#dbeafe' },
  { background: '#0f3b70', foreground: '#ffffff', accent: '#93c5fd' },
];

export function HomePage() {
  const [searchParams] = useSearchParams();
  const searchFromHeader = searchParams.get('busca') ?? '';
  const [filters, setFilters] = useState<EventFilters>({ search: searchFromHeader });
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    setFilters((current) => ({ ...current, search: searchFromHeader }));
  }, [searchFromHeader]);

  const featuredQuery = useQuery({
    queryKey: ['events', 'public', 'featured'],
    queryFn: () => getPublishedEvents({}),
  });
  const eventsQuery = useQuery({
    queryKey: ['events', 'public', filters],
    queryFn: () => getPublishedEvents(filters),
  });

  const featuredEvents = featuredQuery.data ?? [];
  const featuredEvent = featuredEvents[featuredIndex % Math.max(featuredEvents.length, 1)];
  const featuredDate = featuredEvent ? new Date(featuredEvent.startDate) : null;
  const heroTheme = heroThemes[featuredIndex % heroThemes.length];
  const hasFilters = Object.values(filters).some(Boolean);
  const updateFilter = (name: keyof EventFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    if (featuredEvents.length <= 1 || heroPaused) return;

    const interval = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredEvents.length);
    }, 6_000);

    return () => window.clearInterval(interval);
  }, [featuredEvents.length, heroPaused]);

  useEffect(() => {
    if (featuredIndex >= featuredEvents.length && featuredEvents.length > 0) {
      setFeaturedIndex(0);
    }
  }, [featuredEvents.length, featuredIndex]);

  const changeFeaturedEvent = (direction: -1 | 1) => {
    if (featuredEvents.length <= 1) return;
    setFeaturedIndex((current) => (current + direction + featuredEvents.length) % featuredEvents.length);
  };

  return (
    <>
      <section className="overflow-hidden bg-white px-4 pb-8 pt-9 sm:px-6 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-7xl" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)} onFocusCapture={() => setHeroPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false); }}>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-700">Destaques DigiTicket</p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-7xl">O momento é seu</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Encontre o evento, escolha seu lugar e aproveite cada instante.</p>
          </div>

          <div className="relative mx-auto mt-7 max-w-6xl sm:mt-9">
            <div key={featuredEvent?.id ?? 'fallback'} className="hero-slide grid gap-1.5 lg:grid-cols-2" aria-live="polite">
              <div className="relative min-h-[19rem] overflow-hidden rounded-t-[1.5rem] bg-slate-100 sm:min-h-[27rem] lg:min-h-[31rem] lg:rounded-l-[1.5rem] lg:rounded-tr-none">
                {featuredEvent?.posterUrl ? (
                  <img src={featuredEvent.posterUrl} alt={`Evento em destaque: ${featuredEvent.title}`} loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#dbeafe_0%,#60a5fa_100%)]"><span className="absolute -right-12 -top-14 h-56 w-56 rounded-full border-[3rem] border-white/25" /><span className="absolute bottom-8 left-8 max-w-xs text-3xl font-black uppercase leading-none tracking-[-0.05em] text-blue-950">Seu próximo evento começa aqui</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
              </div>

              <div className="relative flex min-h-[21rem] flex-col justify-between overflow-hidden rounded-b-[1.5rem] p-7 sm:min-h-[27rem] sm:p-10 lg:min-h-[31rem] lg:rounded-r-[1.5rem] lg:rounded-bl-none lg:p-12" style={{ backgroundColor: heroTheme.background, color: heroTheme.foreground }}>
                <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[3.5rem] opacity-10" style={{ borderColor: heroTheme.accent }} />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{featuredEvent ? eventCategoryLabels[featuredEvent.category] : 'Agenda DigiTicket'}</p>
                  <h2 className="mt-5 max-w-lg text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-5xl lg:text-6xl">{featuredEvent?.title ?? 'Viva algo novo'}</h2>
                </div>

                {featuredEvent ? (
                  <div className="relative my-8 space-y-2 text-sm font-bold opacity-85">
                    <p className="flex items-center gap-2"><MapPin size={16} /> {featuredEvent.venueName} · {featuredEvent.city}/{featuredEvent.state}</p>
                    <p className="flex items-center gap-2"><CalendarDays size={16} /> {formatEventDate(featuredEvent.startDate)}</p>
                  </div>
                ) : <p className="relative my-8 max-w-sm text-sm leading-6 opacity-75">Shows, teatro, cinema e experiências reunidos em um só lugar.</p>}

                <div className="relative flex items-end justify-between gap-4">
                  <div><span className="block text-[10px] font-black uppercase tracking-wider opacity-60">Próxima data</span><strong className="mt-1 block text-2xl font-black uppercase leading-none" style={{ color: heroTheme.accent }}>{featuredDate ? `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(featuredDate)} ${new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(featuredDate).replace('.', '')}` : 'Em breve'}</strong></div>
                  <Link to={featuredEvent ? `/eventos/${featuredEvent.slug}` : '/#eventos'} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:-translate-y-0.5 hover:bg-blue-50">Ver evento <ArrowRight size={16} /></Link>
                </div>
              </div>
            </div>

            {featuredEvents.length > 1 && (
              <>
                <button type="button" onClick={() => changeFeaturedEvent(-1)} aria-label="Evento anterior" className="absolute -left-2 top-[calc(50%-1.5rem)] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.5)] hover:scale-105 sm:-left-5"><ChevronLeft size={22} /></button>
                <button type="button" onClick={() => changeFeaturedEvent(1)} aria-label="Próximo evento" className="absolute -right-2 top-[calc(50%-1.5rem)] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.5)] hover:scale-105 sm:-right-5"><ChevronRight size={22} /></button>
                <div className="mt-4 flex items-center justify-center gap-2" aria-label="Escolher evento em destaque">{featuredEvents.map((event, index) => <button key={event.id} type="button" onClick={() => setFeaturedIndex(index)} aria-label={`Exibir ${event.title}`} aria-current={index === featuredIndex ? 'true' : undefined} className={`h-2.5 rounded-full transition-all ${index === featuredIndex ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`} />)}</div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-5">
          <span className="mr-3 hidden text-xs font-bold uppercase tracking-[0.12em] text-slate-400 sm:block">Explorar</span>
          <button type="button" aria-pressed={!filters.category} onClick={() => updateFilter('category', '')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!filters.category ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Todos</button>
          {Object.entries(eventCategoryLabels).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filters.category === value} onClick={() => updateFilter('category', value)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filters.category === value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:py-20" id="eventos" aria-labelledby="catalog-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Agenda</p>
            <h2 id="catalog-title" className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl">Próximos eventos</h2>
          </div>
          <p className="text-sm text-slate-500">Escolha o evento e garanta seu ingresso.</p>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_45px_-35px_rgba(15,23,42,0.4)] md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
          <label className="text-xs font-bold text-slate-600"><span className="mb-2 block">Buscar</span><span className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="search" value={filters.search ?? ''} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Evento, artista ou atração" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500" /></span></label>
          <label className="text-xs font-bold text-slate-600"><span className="mb-2 block">Cidade</span><input value={filters.city ?? ''} onChange={(event) => updateFilter('city', event.target.value)} placeholder="Ex.: São Paulo" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500" /></label>
          <label className="text-xs font-bold text-slate-600"><span className="mb-2 block">Data</span><input type="date" value={filters.date ?? ''} onChange={(event) => updateFilter('date', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
          {hasFilters && <button type="button" onClick={() => setFilters({})} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><X size={15} /> Limpar</button>}
        </div>

        {eventsQuery.isPending && <LoadingState label="Carregando eventos" variant="cards" className="mt-8" />}
        {eventsQuery.isError && <div role="alert" className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">Não foi possível carregar os eventos. Confirme se a API está em execução.</div>}
        {eventsQuery.isSuccess && <p className="sr-only" role="status" aria-live="polite">{eventsQuery.data.length === 1 ? '1 evento encontrado' : `${eventsQuery.data.length} eventos encontrados`}</p>}
        {eventsQuery.isSuccess && eventsQuery.data.length === 0 && <EmptyState title="Nenhum evento encontrado" description="Tente remover ou alterar os filtros para ampliar a busca." className="mt-8" />}
        {eventsQuery.isSuccess && eventsQuery.data.length > 0 && <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{eventsQuery.data.map((event) => <EventCard key={event.id} event={event} />)}</div>}
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-slate-950 px-7 py-9 text-white sm:flex-row sm:items-center sm:px-10">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-300">Organiza eventos?</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">Crie, publique e gerencie tudo pelo DigiTicket.</h2></div>
          <Link className="shrink-0 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-blue-50" to="/cadastro">Começar agora</Link>
        </div>
      </section>
    </>
  );
}
