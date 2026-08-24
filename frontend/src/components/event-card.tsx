import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Event } from '../types/event';
import { eventCategoryLabels, formatEventDate, formatMoney } from '../utils/event-formatters';

interface EventCardProps { event: Event; }

export function EventCard({ event }: EventCardProps) {
  const startingPrice = event.ticketTypes?.[0]?.priceCents;
  const eventDate = new Date(event.startDate);
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(eventDate);
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(eventDate).replace('.', '');

  return (
    <article className="group min-w-0 border-b border-slate-200 pb-6">
      <Link className="block" to={`/eventos/${event.slug}`} aria-label={`Ver detalhes de ${event.title}`}>
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-slate-100">
          {event.posterUrl ? (
            <img src={event.posterUrl} alt={`Cartaz do evento ${event.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="relative flex h-full items-end overflow-hidden bg-[#0a1d45] p-5 text-white">
              <span className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[28px] border-blue-500/30" />
              <span className="absolute bottom-5 right-5 h-12 w-12 rounded-full bg-blue-500" />
              <p className="relative max-w-[12rem] text-xl font-extrabold leading-tight tracking-[-0.04em]">{event.title}</p>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700 shadow-sm backdrop-blur">{eventCategoryLabels[event.category]}</span>
        </div>
        <div className="grid grid-cols-[3rem_1fr] gap-4 pt-4">
          <div className="border-r border-slate-200 pr-3 text-center">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-600">{month}</span>
            <span className="mt-0.5 block text-2xl font-extrabold tracking-[-0.05em] text-slate-950">{day}</span>
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-[-0.025em] text-slate-950 group-hover:text-blue-700">{event.title}</h3>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5"><CalendarDays className="shrink-0 text-slate-400" size={13} />{formatEventDate(event.startDate)}</p>
              <p className="flex items-center gap-1.5 truncate"><MapPin className="shrink-0 text-slate-400" size={13} /><span className="truncate">{event.venueName} · {event.city}/{event.state}</span></p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between pl-16 text-xs text-slate-500">
          <span>A partir de <strong className="text-slate-950">{startingPrice !== undefined ? formatMoney(startingPrice) : 'consulte'}</strong></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white"><ArrowUpRight size={15} /></span>
        </div>
      </Link>
    </article>
  );
}
