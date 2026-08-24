import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CalendarCheck2, CalendarDays, FilePenLine, MapPin, Plus, TicketCheck, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { useAuth } from '../hooks/use-auth';
import {
  cancelEvent,
  deleteEvent,
  getOrganizerEvents,
  publishEvent,
} from '../services/event-service';
import type { Event } from '../types/event';
import {
  eventCategoryLabels,
  eventStatusLabels,
  formatEventDate,
} from '../utils/event-formatters';

type EventAction = 'publish' | 'cancel' | 'delete';

export function OrganizerDashboardPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({
    queryKey: ['events', 'organizer'],
    queryFn: () => getOrganizerEvents(token!),
    enabled: Boolean(token),
  });
  const actionMutation = useMutation<Event | void, Error, { action: EventAction; id: string }>({
    mutationFn: ({ action, id }) => {
      if (action === 'publish') return publishEvent(id, token!);
      if (action === 'cancel') return cancelEvent(id, token!);
      return deleteEvent(id, token!);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'public'] }),
      ]);
    },
  });

  const executeAction = (action: EventAction, id: string) => {
    if (action === 'delete' && !window.confirm('Excluir este rascunho definitivamente?')) {
      return;
    }

    if (action === 'cancel' && !window.confirm('Cancelar este evento? Ele sairá do catálogo público.')) {
      return;
    }

    actionMutation.mutate({ action, id });
  };

  const events = eventsQuery.data ?? [];
  const publishedCount = events.filter((event) => event.status === 'PUBLISHED').length;
  const draftCount = events.filter((event) => event.status === 'DRAFT').length;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5" aria-label="Atalhos do organizador">
        <Link to="/organizador" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Visão geral</Link>
        <Link to="/organizador/eventos/novo" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Criar evento</Link>
        <Link to="/organizador/importar-eventos" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Importar</Link>
        <Link to="/#eventos" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Ver catálogo</Link>
      </nav>

      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#071a3d] px-6 py-8 text-white sm:px-9 sm:py-10">
        <span className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[3.5rem] border-blue-500/15" />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Central do organizador</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Seus eventos, em movimento.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">Crie experiências, prepare a venda e acompanhe cada publicação em um só lugar.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/organizador/importar-eventos" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"><Upload size={17} /> Importar</Link>
            <Link to="/organizador/eventos/novo" className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-400"><Plus size={18} /> Criar evento</Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Metric label="Total de eventos" value={events.length} icon={CalendarDays} />
        <Metric label="Publicados" value={publishedCount} icon={TicketCheck} accent />
        <Metric label="Em preparação" value={draftCount} icon={FilePenLine} />
      </div>

      {actionMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
          {actionMutation.error.message}
        </p>
      )}

      {eventsQuery.isPending && <LoadingState label="Carregando seus eventos" variant="list" />}

      {eventsQuery.isError && (
        <p role="alert" className="mt-10 rounded-xl bg-rose-50 p-5 text-rose-700">
          Não foi possível carregar seus eventos.
        </p>
      )}

      {eventsQuery.isSuccess && events.length === 0 && (
        <EmptyState
          title="Seu primeiro evento começa aqui"
          description="Crie um rascunho e publique quando as informações estiverem prontas."
          action={<Link to="/organizador/eventos/novo" className="font-bold text-blue-700">Criar evento</Link>}
        />
      )}

      {events.length > 0 && (
        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Programação</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Eventos cadastrados</h2></div>
            <p className="hidden text-sm text-slate-500 sm:block">{events.length} {events.length === 1 ? 'evento encontrado' : 'eventos encontrados'}</p>
          </div>
          <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-34px_rgba(15,23,42,0.45)]">
              <div className="grid lg:grid-cols-[9rem_1fr_auto] lg:items-stretch">
                <div className="relative hidden min-h-36 overflow-hidden bg-[#102856] lg:block">
                  {event.posterUrl ? <img src={event.posterUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <><span className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[1.75rem] border-blue-400/20" /><CalendarCheck2 className="absolute bottom-5 left-5 text-blue-300" size={25} /></>}
                </div>
                <div className="min-w-0 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${event.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : event.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                      {eventStatusLabels[event.status]}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                      {eventCategoryLabels[event.category]}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold tracking-[-0.025em] text-slate-950">{event.title}</h3>
                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" />{formatEventDate(event.startDate)}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" />{event.city}/{event.state}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-4 lg:max-w-[27rem] lg:justify-end lg:border-l lg:border-t-0 lg:px-6">
                  {event.saleMode === 'GENERAL_ADMISSION' && event.status !== 'CANCELLED' && (
                    <Link className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" to={`/organizador/eventos/${event.id}/ingressos`}>
                      Gerenciar ingressos
                    </Link>
                  )}
                  {event.saleMode === 'RESERVED_SEATING' && event.status === 'DRAFT' && (
                    <Link className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" to={`/organizador/eventos/${event.id}/assentos`}>
                      Configurar assentos
                    </Link>
                  )}
                  {event.status !== 'CANCELLED' && (
                    <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" to={`/organizador/eventos/${event.id}/editar`}>
                      Editar
                    </Link>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <Link className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" to={`/eventos/${event.slug}`}>
                      Ver no catálogo <ArrowUpRight size={14} />
                    </Link>
                  )}
                  {event.status === 'DRAFT' && (
                    <>
                      <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('publish', event.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                        Publicar
                      </button>
                      <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('delete', event.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">
                        Excluir
                      </button>
                    </>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('cancel', event.id)} className="rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-700 disabled:opacity-50">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, icon: Icon, accent = false }: { label: string; value: number; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
      <div className="flex items-start justify-between gap-4">
        <div><p className={`text-xs font-bold ${accent ? 'text-blue-100' : 'text-slate-500'}`}>{label}</p><p className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">{value}</p></div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-700'}`}><Icon size={19} /></span>
      </div>
    </div>
  );
}
