import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Organizador</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Seus eventos</h1>
          <p className="mt-3 text-slate-400">Crie, publique e acompanhe o estado dos seus eventos.</p>
        </div>
        <Link
          to="/organizador/eventos/novo"
          className="rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-emerald-300"
        >
          Criar evento
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Total de eventos" value={events.length} />
        <Metric label="Publicados" value={publishedCount} />
        <Metric label="Rascunhos" value={draftCount} />
      </div>

      {actionMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-rose-200">
          {actionMutation.error.message}
        </p>
      )}

      {eventsQuery.isPending && <p className="mt-10 text-slate-400">Carregando seus eventos…</p>}

      {eventsQuery.isError && (
        <p role="alert" className="mt-10 rounded-xl bg-rose-400/10 p-5 text-rose-200">
          Não foi possível carregar seus eventos.
        </p>
      )}

      {eventsQuery.isSuccess && events.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">Seu primeiro evento começa aqui</h2>
          <p className="mt-2 text-slate-400">Crie um rascunho e publique quando as informações estiverem prontas.</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-10 space-y-4">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                      {eventStatusLabels[event.status]}
                    </span>
                    <span className="text-xs font-medium text-emerald-300">
                      {eventCategoryLabels[event.category]}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{event.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {formatEventDate(event.startDate)} · {event.city}/{event.state}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.saleMode === 'GENERAL_ADMISSION' && event.status !== 'CANCELLED' && (
                    <Link className="rounded-lg border border-emerald-300/20 px-3 py-2 text-sm text-emerald-200 hover:border-emerald-300/40" to={`/organizador/eventos/${event.id}/ingressos`}>
                      Gerenciar ingressos
                    </Link>
                  )}
                  {event.status !== 'CANCELLED' && (
                    <Link className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-white/25" to={`/organizador/eventos/${event.id}/editar`}>
                      Editar
                    </Link>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <Link className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-white/25" to={`/eventos/${event.slug}`}>
                      Ver no catálogo
                    </Link>
                  )}
                  {event.status === 'DRAFT' && (
                    <>
                      <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('publish', event.id)} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                        Publicar
                      </button>
                      <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('delete', event.id)} className="rounded-lg border border-rose-300/20 px-3 py-2 text-sm text-rose-200 disabled:opacity-50">
                        Excluir
                      </button>
                    </>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <button type="button" disabled={actionMutation.isPending} onClick={() => executeAction('cancel', event.id)} className="rounded-lg border border-amber-300/20 px-3 py-2 text-sm text-amber-200 disabled:opacity-50">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
