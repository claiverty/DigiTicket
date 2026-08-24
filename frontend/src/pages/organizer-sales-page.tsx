import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  ReceiptText,
  TicketCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { useAuth } from '../hooks/use-auth';
import { getOrganizerSales } from '../services/organizer-sales-service';
import type { ReservationStatus } from '../types/reservation';
import {
  eventStatusLabels,
  formatEventDate,
  formatMoney,
} from '../utils/event-formatters';

const reservationStatus: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  PENDING_PAYMENT: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-50 text-amber-700',
  },
  PAID: { label: 'Paga', className: 'bg-emerald-50 text-emerald-700' },
  DECLINED: { label: 'Recusada', className: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: 'Expirada', className: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'Cancelada', className: 'bg-slate-100 text-slate-600' },
};

export function OrganizerSalesPage() {
  const { token } = useAuth();
  const salesQuery = useQuery({
    queryKey: ['organizer', 'sales'],
    queryFn: () => getOrganizerSales(token!),
    enabled: Boolean(token),
  });
  const overview = salesQuery.data;
  const eventResults = overview?.eventResults ?? [];

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <nav className="hide-scrollbar mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 sm:mb-6" aria-label="Atalhos do organizador">
        <Link to="/organizador" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Visão geral</Link>
        <Link to="/organizador/vendas" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Vendas</Link>
        <Link to="/organizador/eventos/novo" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Criar evento</Link>
        <Link to="/organizador/importar-eventos" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">Importar</Link>
      </nav>

      <div className="rounded-3xl bg-[#071a3d] px-5 py-6 text-white sm:rounded-[1.75rem] sm:px-9 sm:py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Desempenho dos eventos</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Vendas e reservas</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70">Acompanhe os resultados simulados e as movimentações dos seus eventos.</p>
      </div>

      {salesQuery.isPending && <LoadingState label="Carregando resultados comerciais" variant="list" />}
      {salesQuery.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">Não foi possível carregar as vendas do organizador.</p>}

      {overview && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-4">
            <SalesMetric label="Reservas" value={String(overview.summary.reservationCount)} icon={ReceiptText} />
            <SalesMetric label="Reservas pagas" value={String(overview.summary.paidReservationCount)} icon={CheckCircle2} />
            <SalesMetric label="Ingressos vendidos" value={String(overview.summary.ticketsSold)} icon={TicketCheck} accent />
            <SalesMetric label="Receita simulada" value={formatMoney(overview.summary.simulatedRevenueCents)} icon={Banknote} />
          </div>

          <div className="mt-10">
            <div className="mb-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Comparativo</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Resultado por evento</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {eventResults.map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{eventStatusLabels[event.status]}</span>
                      <h3 className="mt-2 line-clamp-2 text-lg font-extrabold text-slate-950">{event.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{formatEventDate(event.startDate)} · {event.city}/{event.state}</p>
                    </div>
                    <Link to={event.status === 'PUBLISHED' ? `/eventos/${event.slug}` : `/organizador/eventos/${event.id}/editar`} className="shrink-0 text-sm font-bold text-blue-700">Abrir →</Link>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                    <SmallMetric label="Reservas" value={event.reservationCount} />
                    <SmallMetric label="Pagas" value={event.paidReservationCount} />
                    <SmallMetric label="Vendidos" value={event.ticketsSold} />
                    <SmallMetric label="Receita" value={formatMoney(event.simulatedRevenueCents)} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[0.85fr_1.4fr]">
            <div>
              <div className="mb-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Agenda</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Próximos eventos</h2>
              </div>
              {overview.upcomingEvents.length === 0 ? (
                <EmptyState title="Nenhum evento próximo" description="Publique um evento futuro para acompanhar seus resultados aqui." />
              ) : (
                <div className="space-y-3">
                  {overview.upcomingEvents.map((event) => (
                    <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CalendarClock size={20} /></span>
                        <div className="min-w-0">
                          <Link to={`/eventos/${event.slug}`} className="font-extrabold text-slate-950 hover:text-blue-700">{event.title}</Link>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{formatEventDate(event.startDate)} · {event.city}/{event.state}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                        <SmallMetric label="Reservas" value={event.reservationCount} />
                        <SmallMetric label="Vendidos" value={event.ticketsSold} />
                        <SmallMetric label="Receita" value={formatMoney(event.simulatedRevenueCents)} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Movimentações</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Reservas recentes</h2>
              </div>
              {overview.recentReservations.length === 0 ? (
                <EmptyState title="Nenhuma reserva recebida" description="As reservas dos seus eventos aparecerão aqui." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {overview.recentReservations.map((reservation) => {
                    const status = reservationStatus[reservation.status];
                    return (
                      <article key={reservation.id} className="border-b border-slate-100 p-5 last:border-b-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${status.className}`}>{status.label}</span>
                              <span className="text-xs text-slate-400">{formatReservationDate(reservation.createdAt)}</span>
                            </div>
                            <h3 className="mt-3 font-extrabold text-slate-950">{reservation.event.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{reservation.customer.name} · {reservation.customer.email}</p>
                          </div>
                          <div className="sm:text-right">
                            <strong className="text-blue-700">{formatMoney(reservation.totalCents)}</strong>
                            <p className="mt-1 text-xs text-slate-500">{reservation.quantity} ingresso(s) · {reservation.ticketsCreated} emitido(s)</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function SalesMetric({ label, value, icon: Icon, accent = false }: { label: string; value: string; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 sm:p-5 ${accent ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0"><p className={`text-[10px] font-bold leading-tight sm:text-xs ${accent ? 'text-blue-100' : 'text-slate-500'}`}>{label}</p><p className="mt-1.5 break-words text-xl font-extrabold tracking-[-0.04em] sm:mt-2 sm:text-2xl">{value}</p></div>
        <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${accent ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-700'}`}><Icon size={19} /></span>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-extrabold text-slate-800">{value}</p></div>;
}

function formatReservationDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
