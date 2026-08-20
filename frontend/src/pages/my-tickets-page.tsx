import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
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
    <section className="mx-auto max-w-6xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Cliente</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Meus ingressos</h1>
      <p className="mt-3 text-slate-400">Acesse o QR Code, o código manual e os links compartilháveis dos seus ingressos.</p>

      {ticketsQuery.isPending && <p className="mt-10 text-slate-400">Carregando ingressos…</p>}
      {ticketsQuery.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-400/10 p-4 text-rose-200">Não foi possível carregar seus ingressos.</p>}
      {ticketsQuery.isSuccess && tickets.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">Você ainda não possui ingressos</h2>
          <p className="mt-2 text-slate-400">Ingressos aparecem aqui depois de um pagamento simulado aprovado.</p>
          <Link to="/" className="mt-5 inline-block font-semibold text-emerald-300">Explorar eventos</Link>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/meus-ingressos/${ticket.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-emerald-300/30">
            <div className="aspect-[16/9] bg-slate-900">
              {ticket.event.posterUrl && <img src={ticket.event.posterUrl} alt="" className="h-full w-full object-cover opacity-70" />}
            </div>
            <div className="p-5">
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">{ticket.status === 'ACTIVE' ? 'Ativo' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}</span>
              <h2 className="mt-4 text-xl font-semibold text-white">{ticket.event.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{ticket.ticketType.name}</p>
              <p className="mt-2 text-sm text-slate-400">{formatEventDate(ticket.event.startDate)}</p>
              <p className="mt-5 text-sm font-semibold text-emerald-300">Abrir ingresso →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
