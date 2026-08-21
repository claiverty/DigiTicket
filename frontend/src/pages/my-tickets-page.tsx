import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, ChevronDown, MapPin, Send, Ticket as TicketIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { getMyTickets } from '../services/ticket-service';
import type { Ticket } from '../types/ticket';
import { formatEventDate } from '../utils/event-formatters';

interface TicketGroup {
  event: Ticket['event'];
  tickets: Ticket[];
}

function groupTicketsByEvent(tickets: Ticket[]) {
  const groups = new Map<string, TicketGroup>();

  tickets.forEach((ticket) => {
    const group = groups.get(ticket.event.id);

    if (group) {
      group.tickets.push(ticket);
      return;
    }

    groups.set(ticket.event.id, {
      event: ticket.event,
      tickets: [ticket],
    });
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      tickets: group.tickets.sort((first, second) =>
        first.ticketType.name.localeCompare(second.ticketType.name, 'pt-BR'),
      ),
    }))
    .sort(
      (first, second) =>
        new Date(first.event.startDate).getTime() -
        new Date(second.event.startDate).getTime(),
    );
}

function getTicketStatus(ticket: Ticket) {
  if (ticket.pendingTransfer) return 'Em transferência';
  if (ticket.status === 'ACTIVE') return 'Ativo';
  if (ticket.status === 'USED') return 'Utilizado';
  return 'Cancelado';
}

export function MyTicketsPage() {
  const { token } = useAuth();
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: () => getMyTickets(token!),
    enabled: Boolean(token),
  });
  const tickets = ticketsQuery.data ?? [];
  const ticketGroups = groupTicketsByEvent(tickets);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#071a3d] px-6 py-8 text-white sm:px-9 sm:py-10">
        <span className="absolute -right-14 -top-20 h-60 w-60 rounded-full border-[3.25rem] border-blue-500/15" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Carteira DigiTicket</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Meus ingressos</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">Seus acessos, QR Codes e informações do evento sempre à mão.</p></div>
          <Link to="/transferencias" className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"><Send size={16} /> Transferências</Link>
        </div>
      </div>

      {ticketsQuery.isPending && <LoadingState label="Carregando ingressos" variant="cards" />}
      {ticketsQuery.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">Não foi possível carregar seus ingressos.</p>}
      {ticketsQuery.isSuccess && tickets.length === 0 && (
        <EmptyState
          title="Você ainda não possui ingressos"
          description="Ingressos aparecem aqui depois de um pagamento simulado aprovado."
          action={<Link to="/" className="font-bold text-blue-700">Explorar eventos</Link>}
        />
      )}

      <div className="mt-10 space-y-10">
        {ticketGroups.map((group) => (
          <section key={group.event.id} aria-labelledby={`event-${group.event.id}`}>
            <button
              type="button"
              onClick={() => setOpenEventId((currentId) => currentId === group.event.id ? null : group.event.id)}
              aria-expanded={openEventId === group.event.id}
              aria-controls={`tickets-${group.event.id}`}
              className={`flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition sm:flex-row sm:items-stretch ${
                openEventId === group.event.id
                  ? 'border-blue-300 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <div className="relative h-36 shrink-0 overflow-hidden bg-[#102856] sm:h-auto sm:w-52">
                {group.event.posterUrl ? (
                  <img src={group.event.posterUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <TicketIcon className="absolute bottom-5 left-5 text-blue-300" size={30} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 id={`event-${group.event.id}`} className="text-2xl font-extrabold tracking-[-0.035em] text-slate-950">{group.event.title}</h2>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                      <p className="flex items-center gap-2"><CalendarDays size={16} className="text-blue-600" />{formatEventDate(group.event.startDate)}</p>
                      <p className="flex items-center gap-2"><MapPin size={16} className="text-blue-600" />{group.event.venueName}</p>
                    </div>
                  </div>
                  <span className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700">
                    {group.tickets.length} {group.tickets.length === 1 ? 'ingresso' : 'ingressos'}
                    <ChevronDown size={15} className={`transition-transform ${openEventId === group.event.id ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </div>
            </button>

            {openEventId === group.event.id && (
              <div id={`tickets-${group.event.id}`} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.tickets.map((ticket) => (
                  <Link key={ticket.id} to={`/meus-ingressos/${ticket.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_45px_-38px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><TicketIcon size={20} /></span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{getTicketStatus(ticket)}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em] text-slate-950">{ticket.ticketType.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Código {ticket.manualCode}</p>
                    {ticket.seat && <p className="mt-3 text-sm text-slate-600">Assento {ticket.seat.rowLabel}{ticket.seat.seatNumber}</p>}
                    <p className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-950">Abrir ingresso <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white"><ArrowRight size={15} /></span></p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
