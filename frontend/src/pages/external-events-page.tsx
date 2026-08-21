import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import {
  importExternalEvent,
  searchExternalEvents,
} from '../services/integration-service';
import type { ExternalEvent } from '../types/external-event';
import {
  eventCategoryLabels,
  formatEventDate,
} from '../utils/event-formatters';

interface SearchFilters {
  keyword: string;
  city: string;
  page: number;
}

export function ExternalEventsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [importedEventId, setImportedEventId] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['external-events', filters],
    queryFn: () => searchExternalEvents(filters!, token!),
    enabled: Boolean(filters && token),
  });

  const importMutation = useMutation({
    mutationFn: (externalId: string) => importExternalEvent(externalId, token!),
    onSuccess: async (event) => {
      setImportedEventId(event.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] }),
        queryClient.invalidateQueries({ queryKey: ['external-events'] }),
      ]);
    },
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return;

    setImportedEventId(null);
    setFilters({ keyword: normalizedKeyword, city: city.trim(), page: 0 });
  };

  const changePage = (page: number) => {
    if (!filters) return;
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const result = eventsQuery.data;

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Link to="/organizador" className="text-sm text-emerald-300 hover:text-emerald-200">
        ← Voltar aos seus eventos
      </Link>

      <div className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Importação de eventos
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Encontre uma referência para seu evento
        </h1>
        <p className="mt-3 text-slate-400">
          Pesquise eventos no Brasil e importe os dados como rascunho. Depois, revise tudo e deixe com a cara do DigiTicket.
        </p>
      </div>

      <form onSubmit={submitSearch} className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_0.65fr_auto]">
        <label className="text-sm text-slate-300">
          Evento ou artista
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            minLength={2}
            maxLength={100}
            required
            placeholder="Ex.: festival, artista ou espetáculo"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </label>
        <label className="text-sm text-slate-300">
          Cidade (opcional)
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={80}
            placeholder="Ex.: São Paulo"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </label>
        <button type="submit" disabled={eventsQuery.isFetching} className="self-end rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
          {eventsQuery.isFetching ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {eventsQuery.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-rose-200">
          {eventsQuery.error.message}
        </p>
      )}

      {importMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-rose-200">
          {importMutation.error.message}
        </p>
      )}

      {importedEventId && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-400/10 p-4 text-emerald-100">
          <span>Evento importado como rascunho. Revise os dados antes de publicar.</span>
          <Link to={`/organizador/eventos/${importedEventId}/editar`} className="font-semibold underline underline-offset-4">
            Revisar evento
          </Link>
        </div>
      )}

      {result && result.events.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          Nenhum evento encontrado. Tente outro termo ou remova a cidade.
        </div>
      )}

      {result && result.events.length > 0 && (
        <>
          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Resultados</h2>
              <p className="mt-1 text-sm text-slate-400">{result.totalElements} evento(s) encontrado(s)</p>
            </div>
            <span className="text-xs text-slate-500">Fonte: Ticketmaster Discovery API</span>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {result.events.map((event) => (
              <ExternalEventCard
                key={event.id}
                event={event}
                importing={importMutation.isPending && importMutation.variables === event.id}
                onImport={() => importMutation.mutate(event.id)}
              />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button type="button" disabled={result.page === 0 || eventsQuery.isFetching} onClick={() => changePage(result.page - 1)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-40">
                Anterior
              </button>
              <span className="text-sm text-slate-400">Página {result.page + 1} de {result.totalPages}</span>
              <button type="button" disabled={result.page + 1 >= result.totalPages || eventsQuery.isFetching} onClick={() => changePage(result.page + 1)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-40">
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ExternalEventCard({
  event,
  importing,
  onImport,
}: {
  event: ExternalEvent;
  importing: boolean;
  onImport: () => void;
}) {
  const disabled = event.alreadyImported || !event.importable || importing;
  const buttonLabel = event.alreadyImported
    ? 'Já importado'
    : !event.importable
      ? 'Data não confirmada'
      : importing
        ? 'Importando…'
        : 'Importar rascunho';

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="aspect-[16/9] bg-slate-900">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Imagem não disponível</div>
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          {eventCategoryLabels[event.category]}
        </span>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">{event.title}</h3>
        <p className="mt-3 text-sm text-slate-400">
          {event.startDate ? formatEventDate(event.startDate) : 'Data a confirmar'}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {event.venueName} · {event.city}/{event.state}
        </p>
        <button type="button" disabled={disabled} onClick={onImport} className="mt-5 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
