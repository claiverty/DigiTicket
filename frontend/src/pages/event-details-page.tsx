import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, ChevronDown, ChevronUp, MapPin, Tag, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublishedEvent } from '../services/event-service';
import {
  eventCategoryLabels,
  eventSaleModeLabels,
  formatEventDate,
} from '../utils/event-formatters';
import { TicketSelection } from '../components/ticket-selection';
import { LoadingState } from '../components/loading-state';

export function EventDetailsPage() {
  const { slug = '' } = useParams();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const eventQuery = useQuery({
    queryKey: ['events', 'public', slug],
    queryFn: () => getPublishedEvent(slug),
    enabled: Boolean(slug),
  });

  if (eventQuery.isPending) {
    return <LoadingState label="Carregando evento" variant="details" className="" />;
  }

  if (eventQuery.isError) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-slate-950">Evento não encontrado</h1>
        <p className="mt-3 text-slate-500">Ele pode não estar publicado ou não existir.</p>
        <Link className="mt-6 inline-flex items-center gap-2 font-bold text-blue-700" to="/">
          <ArrowLeft size={17} />
          Voltar ao catálogo
        </Link>
      </section>
    );
  }

  const event = eventQuery.data;
  const canCollapseDescription = event.description.length > 360;

  return (
    <article>
      <div className="relative h-[26rem] overflow-hidden bg-blue-100 sm:h-[32rem]">
        {event.posterUrl && (
          <img src={event.posterUrl} alt="" loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-10 sm:pb-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">
            {eventCategoryLabels[event.category]}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-6xl">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1fr_23rem] lg:py-16">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Conheça a experiência</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-slate-950">Sobre o evento</h2>
          <div className="relative mt-5 max-w-3xl">
            <p className={`whitespace-pre-line text-base leading-8 text-slate-600 ${canCollapseDescription && !descriptionExpanded ? 'line-clamp-6' : ''}`}>{event.description}</p>
            {canCollapseDescription && !descriptionExpanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f7f9fc] to-transparent" />}
          </div>
          {canCollapseDescription && (
            <button type="button" aria-expanded={descriptionExpanded} onClick={() => setDescriptionExpanded((current) => !current)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              {descriptionExpanded ? <><ChevronUp size={16} /> Mostrar menos</> : <>Ver descrição completa <ChevronDown size={16} /></>}
            </button>
          )}
          {event.organizer && (
            <p className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500"><UserRound size={17} className="text-blue-600" />Organizado por <strong className="text-slate-800">{event.organizer.name}</strong></p>
          )}
        </div>

        <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-34px_rgba(15,23,42,0.35)] lg:-mt-28 lg:relative lg:z-10">
          <dl className="space-y-5">
            <div>
              <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400"><CalendarDays size={16} className="text-blue-600" />Quando</dt>
              <dd className="mt-2 text-sm font-semibold leading-6 text-slate-800">{formatEventDate(event.startDate)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400"><MapPin size={16} className="text-blue-600" />Onde</dt>
              <dd className="mt-2 text-sm font-bold text-slate-800">{event.venueName}</dd>
              <dd className="mt-1 text-sm leading-6 text-slate-500">{event.address}, {event.city}/{event.state}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400"><Tag size={16} className="text-blue-600" />Formato</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-800">{eventSaleModeLabels[event.saleMode]}</dd>
            </div>
          </dl>
          <TicketSelection event={event} />
        </aside>
      </div>
    </article>
  );
}
