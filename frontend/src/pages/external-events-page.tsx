import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ArrowRight, FileCheck2, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
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
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <Link to="/organizador" className="text-sm font-bold text-blue-700">
        ← Voltar aos seus eventos
      </Link>

      <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#071a3d] px-6 py-8 text-white sm:px-9 sm:py-10">
        <span className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[3.5rem] border-blue-500/15" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Importação inteligente</p><h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Encontre uma referência para seu evento.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/70">Pesquise eventos no Brasil e transforme as informações encontradas em um rascunho editável no DigiTicket.</p></div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-2xl bg-white/10 p-4"><Sparkles className="mb-3 text-blue-300" size={19} /><strong className="block text-white">Dados automáticos</strong><span className="mt-1 block text-blue-100/60">Título, data e local</span></div><div className="rounded-2xl bg-white/10 p-4"><FileCheck2 className="mb-3 text-blue-300" size={19} /><strong className="block text-white">Sempre rascunho</strong><span className="mt-1 block text-blue-100/60">Você revisa antes</span></div></div></div>
      </div>

      <form onSubmit={submitSearch} className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_45px_-35px_rgba(15,23,42,0.45)] md:grid-cols-[1fr_0.65fr_auto]">
        <label className="text-sm font-bold text-slate-700">
          Evento ou artista
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            minLength={2}
            maxLength={100}
            required
            placeholder="Ex.: festival, artista ou espetáculo"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
          />
        </label>
        <label className="text-sm font-bold text-slate-700">
          Cidade (opcional)
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={80}
            placeholder="Ex.: São Paulo"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
          />
        </label>
        <button type="submit" disabled={eventsQuery.isFetching} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          {eventsQuery.isFetching ? 'Buscando…' : <><Search size={17} /> Buscar</>}
        </button>
      </form>

      {eventsQuery.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
          {eventsQuery.error.message}
        </p>
      )}

      {importMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
          {importMutation.error.message}
        </p>
      )}

      {importedEventId && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          <span>Evento importado como rascunho. Revise os dados antes de publicar.</span>
          <Link to={`/organizador/eventos/${importedEventId}/editar`} className="font-semibold underline underline-offset-4">
            Revisar evento
          </Link>
        </div>
      )}

      {filters && eventsQuery.isFetching && !result && (
        <LoadingState label="Buscando eventos externos" variant="cards" className="mt-10" />
      )}

      {result && result.events.length === 0 && (
        <EmptyState title="Nenhum evento encontrado" description="Tente outro termo de pesquisa ou remova o filtro de cidade." />
      )}

      {result && result.events.length > 0 && (
        <>
          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Resultados</h2>
              <p className="mt-1 text-sm text-slate-400">{result.totalElements} evento(s) encontrado(s)</p>
            </div>
            <span className="text-xs text-slate-500">Fonte externa conectada</span>
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
              <button type="button" disabled={result.page === 0 || eventsQuery.isFetching} onClick={() => changePage(result.page - 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40">
                Anterior
              </button>
              <span className="text-sm text-slate-400">Página {result.page + 1} de {result.totalPages}</span>
              <button type="button" disabled={result.page + 1 >= result.totalPages || eventsQuery.isFetching} onClick={() => changePage(result.page + 1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40">
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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/9] bg-blue-50">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Imagem não disponível</div>
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
          {eventCategoryLabels[event.category]}
        </span>
        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold text-slate-950">{event.title}</h3>
        <p className="mt-3 text-sm text-slate-400">
          {event.startDate ? formatEventDate(event.startDate) : 'Data a confirmar'}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {event.venueName} · {event.city}/{event.state}
        </p>
        <button type="button" disabled={disabled} onClick={onImport} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
          <span className="inline-flex items-center gap-2">{buttonLabel}{!disabled && <ArrowRight size={15} />}</span>
        </button>
      </div>
    </article>
  );
}
