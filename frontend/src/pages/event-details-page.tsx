import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPublishedEvent } from '../services/event-service';
import {
  eventCategoryLabels,
  eventSaleModeLabels,
  formatEventDate,
} from '../utils/event-formatters';

export function EventDetailsPage() {
  const { slug = '' } = useParams();
  const eventQuery = useQuery({
    queryKey: ['events', 'public', slug],
    queryFn: () => getPublishedEvent(slug),
    enabled: Boolean(slug),
  });

  if (eventQuery.isPending) {
    return <div className="mx-auto max-w-6xl px-6 py-20 text-slate-400">Carregando evento…</div>;
  }

  if (eventQuery.isError) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">Evento não encontrado</h1>
        <p className="mt-3 text-slate-400">Ele pode não estar publicado ou não existir.</p>
        <Link className="mt-6 inline-block font-semibold text-emerald-300" to="/">
          Voltar ao catálogo
        </Link>
      </section>
    );
  }

  const event = eventQuery.data;

  return (
    <article>
      <div className="relative h-[22rem] overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-400/20 to-indigo-500/10">
        {event.posterUrl && (
          <img src={event.posterUrl} alt="" className="h-full w-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {eventCategoryLabels[event.category]}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="text-2xl font-semibold text-white">Sobre o evento</h2>
          <p className="mt-5 whitespace-pre-line leading-8 text-slate-300">{event.description}</p>
          {event.organizer && (
            <p className="mt-8 text-sm text-slate-400">Organizado por {event.organizer.name}</p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-6">
          <dl className="space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quando</dt>
              <dd className="mt-1 text-slate-200">{formatEventDate(event.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Onde</dt>
              <dd className="mt-1 text-slate-200">{event.venueName}</dd>
              <dd className="mt-1 text-sm text-slate-400">{event.address}, {event.city}/{event.state}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Formato</dt>
              <dd className="mt-1 text-slate-200">{eventSaleModeLabels[event.saleMode]}</dd>
            </div>
          </dl>
          <div className="mt-6 rounded-xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            A seleção e os preços dos ingressos serão disponibilizados na próxima etapa.
          </div>
        </aside>
      </div>
    </article>
  );
}
