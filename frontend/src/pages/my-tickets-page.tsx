import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, MapPin, Send, Ticket as TicketIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { getMyTickets } from '../services/ticket-service';
import { formatEventDate } from '../utils/event-formatters';

export function MyTicketsPage() {
  const { token } = useAuth();
  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: () => getMyTickets(token!),
    enabled: Boolean(token),
  });
  const tickets = ticketsQuery.data ?? [];

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

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/meus-ingressos/${ticket.id}`} className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_14px_45px_-35px_rgba(15,23,42,0.5)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
            <div className="relative aspect-[16/8.8] overflow-hidden bg-[#102856]">
              {ticket.event.posterUrl ? <img src={ticket.event.posterUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <TicketIcon className="absolute bottom-5 left-5 text-blue-300" size={28} />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{ticket.pendingTransfer ? 'Em transferência' : ticket.status === 'ACTIVE' ? 'Ativo' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}</span>
            </div>
            <div className="relative p-5">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border-r border-slate-200 bg-[#f7f9fc]" /><span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border-l border-slate-200 bg-[#f7f9fc]" />
              <div className="border-t border-dashed border-slate-200 pt-4">
                <h2 className="line-clamp-2 text-xl font-extrabold tracking-[-0.03em] text-slate-950">{ticket.event.title}</h2>
                <p className="mt-1.5 text-sm font-bold text-blue-700">{ticket.ticketType.name}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><CalendarDays size={14} />{formatEventDate(ticket.event.startDate)}</p><p className="flex items-center gap-2"><MapPin size={14} />{ticket.event.venueName}</p></div>
                <p className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-950">Abrir ingresso <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"><ArrowRight size={15} /></span></p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
