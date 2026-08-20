import { Link } from 'react-router-dom';
import type { Event } from '../types/event';
import {
  eventCategoryLabels,
  formatEventDate,
} from '../utils/event-formatters';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-emerald-300/30">
      <Link to={`/eventos/${event.slug}`}>
        <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-400/25 via-slate-900 to-indigo-400/20">
          {event.posterUrl ? (
            <img
              src={event.posterUrl}
              alt={`Cartaz do evento ${event.title}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-end p-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {eventCategoryLabels[event.category]}
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {eventCategoryLabels[event.category]}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{event.title}</h2>
          <p className="mt-3 text-sm text-slate-300">{formatEventDate(event.startDate)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {event.venueName} · {event.city}/{event.state}
          </p>
          <p className="mt-5 text-sm font-semibold text-emerald-300">
            Ver detalhes →
          </p>
        </div>
      </Link>
    </article>
  );
}
