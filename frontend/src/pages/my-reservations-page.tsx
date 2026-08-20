import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
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

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Cliente</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Minhas reservas</h1>
      <p className="mt-3 text-slate-400">Ingressos pendentes ficam bloqueados por 10 minutos. O pagamento será adicionado na próxima fase.</p>

      {reservationsQuery.isPending && <p className="mt-10 text-slate-400">Carregando reservas…</p>}
      {reservationsQuery.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-400/10 p-4 text-rose-200">Não foi possível carregar suas reservas.</p>}
      {cancelMutation.isError && <p role="alert" className="mt-8 rounded-xl bg-rose-400/10 p-4 text-rose-200">{cancelMutation.error instanceof ApiError ? cancelMutation.error.message : 'Não foi possível cancelar a reserva.'}</p>}
      {reservationsQuery.isSuccess && reservations.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">Nenhuma reserva por aqui</h2>
          <Link to="/" className="mt-4 inline-block font-semibold text-emerald-300">Explorar eventos</Link>
        </div>
      )}

      <div className="mt-10 space-y-5">
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            now={now}
            cancelling={cancelMutation.isPending}
            onCancel={() => cancelMutation.mutate(reservation.id)}
          />
        ))}
      </div>
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
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="grid sm:grid-cols-[12rem_1fr]">
        <div className="min-h-40 bg-slate-900">
          {reservation.event.posterUrl && <img src={reservation.event.posterUrl} alt="" className="h-full w-full object-cover opacity-70" />}
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">{isPending ? statusLabels.PENDING_PAYMENT : remainingMs === 0 && reservation.status === 'PENDING_PAYMENT' ? 'Expirando…' : statusLabels[reservation.status]}</span>
              <h2 className="mt-4 text-xl font-semibold text-white">{reservation.event.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{formatEventDate(reservation.event.startDate)} · {reservation.event.venueName}</p>
            </div>
            <strong className="text-lg text-emerald-300">{formatMoney(reservation.totalCents)}</strong>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-300">
            {reservation.items.map((item) => <li key={item.id}>{item.quantity}× {item.ticketType.name} — {formatMoney(item.unitPriceCents)} cada</li>)}
          </ul>
          {isPending && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <p className="font-mono text-sm text-amber-200">Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
              <button type="button" disabled={cancelling} onClick={onCancel} className="rounded-lg border border-rose-300/20 px-3 py-2 text-sm text-rose-200 disabled:opacity-50">Cancelar e liberar estoque</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
