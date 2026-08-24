import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { ApiError } from '../services/api';
import {
  cancelReservation,
  getMyReservations,
} from '../services/reservation-service';
import type {
  Reservation,
  ReservationStatus,
} from '../types/reservation';
import { formatEventDate, formatMoney } from '../utils/event-formatters';

const statusLabels: Record<ReservationStatus, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Paga',
  DECLINED: 'Pagamento recusado',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

export function MyReservationsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [showHistory, setShowHistory] = useState(false);
  const reservationsQuery = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getMyReservations(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelReservation(id, token!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'public'] }),
      ]);
    },
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const reservations = reservationsQuery.data ?? [];
  const pendingReservations = reservations.filter(
    (reservation) =>
      reservation.status === 'PENDING_PAYMENT' &&
      new Date(reservation.expiresAt).getTime() > now,
  );
  const reservationHistory = reservations.filter(
    (reservation) => !pendingReservations.includes(reservation),
  );

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Sua agenda</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Minhas reservas</h1>
      <p className="mt-3 text-slate-500">Ingressos pendentes ficam bloqueados por 10 minutos enquanto você conclui o pagamento.</p>

      {reservationHistory.length > 0 && (
        <button
          type="button"
          aria-expanded={showHistory}
          aria-controls="historico-de-reservas"
          onClick={() => setShowHistory((current) => !current)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          <History size={17} />
          {showHistory ? 'Ocultar histórico' : `Ver histórico (${reservationHistory.length})`}
          <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
      )}

      {reservationsQuery.isPending && <LoadingState label="Carregando reservas" variant="list" />}
      {reservationsQuery.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">Não foi possível carregar suas reservas.</p>}
      {cancelMutation.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">{cancelMutation.error instanceof ApiError ? cancelMutation.error.message : 'Não foi possível cancelar a reserva.'}</p>}
      {reservationsQuery.isSuccess && reservations.length === 0 && (
        <EmptyState
          title="Nenhuma reserva por aqui"
          description="Escolha um evento e reserve seus ingressos por até 10 minutos."
          action={<Link to="/" className="font-bold text-blue-700">Explorar eventos</Link>}
        />
      )}

      {reservationsQuery.isSuccess && reservations.length > 0 && pendingReservations.length === 0 && (
        <EmptyState
          title="Nenhuma reserva aguardando pagamento"
          description="Suas reservas concluídas ou encerradas continuam disponíveis no histórico."
          action={<Link to="/#eventos" className="font-bold text-blue-700">Explorar eventos</Link>}
        />
      )}

      <div className="mt-10 space-y-5">
        {pendingReservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            now={now}
            cancelling={cancelMutation.isPending}
            onCancel={() => cancelMutation.mutate(reservation.id)}
          />
        ))}
      </div>

      {showHistory && reservationHistory.length > 0 && (
        <div id="historico-de-reservas" className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Histórico</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Reservas anteriores</h2>
          <div className="mt-6 space-y-5">
            {reservationHistory.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                now={now}
                cancelling={cancelMutation.isPending}
                onCancel={() => cancelMutation.mutate(reservation.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReservationCard({
  reservation,
  now,
  cancelling,
  onCancel,
}: {
  reservation: Reservation;
  now: number;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const remainingMs = Math.max(0, new Date(reservation.expiresAt).getTime() - now);
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1_000);
  const isPending = reservation.status === 'PENDING_PAYMENT' && remainingMs > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid sm:grid-cols-[12rem_1fr]">
        <div className="min-h-40 bg-blue-50">
          {reservation.event.posterUrl && <img src={reservation.event.posterUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-70" />}
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{isPending ? statusLabels.PENDING_PAYMENT : remainingMs === 0 && reservation.status === 'PENDING_PAYMENT' ? 'Expirando…' : statusLabels[reservation.status]}</span>
              <h2 className="mt-4 text-xl font-extrabold text-slate-950">{reservation.event.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{formatEventDate(reservation.event.startDate)} · {reservation.event.venueName}</p>
            </div>
            <strong className="text-lg text-blue-700">{formatMoney(reservation.totalCents)}</strong>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            {reservation.items.map((item) => <li key={item.id}>{item.quantity}× {item.ticketType.name} — {formatMoney(item.unitPriceCents)} cada</li>)}
          </ul>
          {reservation.heldSeats.length > 0 && (
            <p className="mt-3 text-sm text-amber-800">
              Assentos: {reservation.heldSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ')}
            </p>
          )}
          {isPending && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="font-mono text-sm text-amber-700">Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={cancelling} onClick={onCancel} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">Cancelar</button>
                <Link to={`/checkout/${reservation.id}`} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">Ir para pagamento</Link>
              </div>
            </div>
          )}
          {reservation.status === 'PAID' && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-blue-700">
              <span>{reservation._count.tickets} ingresso(s) emitidos.</span>
              <Link to="/meus-ingressos" className="font-bold text-blue-700">Abrir ingressos →</Link>
            </div>
          )}
          {reservation.status === 'DECLINED' && (
            <p className="mt-5 border-t border-slate-200 pt-5 text-sm text-rose-700">Pagamento recusado. O estoque desta reserva foi liberado.</p>
          )}
        </div>
      </div>
    </article>
  );
}
