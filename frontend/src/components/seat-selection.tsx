import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import { createSeatReservation, getPublicSeats } from '../services/seating-service';
import type { Event } from '../types/event';
import type { EventSeat } from '../types/seat';
import { formatMoney } from '../utils/event-formatters';

export function SeatSelection({ event }: { event: Event }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const seatsQuery = useQuery({
    queryKey: ['seats', event.id],
    queryFn: () => getPublicSeats(event.id),
    refetchInterval: 30_000,
  });
  const reservationMutation = useMutation({
    mutationFn: () => createSeatReservation(event.id, selected, token!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seats', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
      ]);
      navigate('/minhas-reservas');
    },
  });
  const seats = seatsQuery.data ?? [];
  const sections = seats.reduce((grouped, seat) => {
    const section = grouped.get(seat.ticketTypeId) ?? {
      ticketType: seat.ticketType,
      rows: new Map<string, EventSeat[]>(),
    };
    const row = section.rows.get(seat.rowLabel) ?? [];
    row.push(seat);
    section.rows.set(seat.rowLabel, row);
    grouped.set(seat.ticketTypeId, section);
    return grouped;
  }, new Map<string, { ticketType: EventSeat['ticketType']; rows: Map<string, EventSeat[]> }>());
  const selectedSeats = seats.filter((seat) => selected.includes(seat.id));
  const totalCents = selectedSeats.reduce((total, seat) => total + seat.ticketType.priceCents, 0);

  const toggleSeat = (seatId: string) => {
    setSelected((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : current.length < 10
          ? [...current, seatId]
          : current,
    );
  };

  if (seatsQuery.isPending) return <p className="mt-6 text-sm text-slate-400">Carregando mapa de assentos…</p>;
  if (seatsQuery.isError) return <p className="mt-6 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">Não foi possível carregar o mapa.</p>;

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h2 className="text-lg font-semibold text-white">Escolha seus assentos</h2>
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:p-6">
        <div className="mx-auto mb-8 max-w-lg rounded-b-[50%] border-t-4 border-emerald-300/60 pt-3 text-center text-xs uppercase tracking-[0.25em] text-slate-500">Palco</div>
        <div className="overflow-x-auto pb-2">
          <div className="mx-auto w-max space-y-8">
            {[...sections.values()].map((section) => (
              <div key={section.ticketType.id}>
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {section.ticketType.name} · {formatMoney(section.ticketType.priceCents)}
                </p>
                <div className={section.ticketType.seatDisplaySize === 'LARGE' ? 'space-y-3' : 'space-y-2'}>
                  {[...section.rows.entries()].map(([rowLabel, rowSeats]) => (
                    <div key={rowLabel} className={section.ticketType.seatDisplaySize === 'LARGE' ? 'flex items-center gap-3' : 'flex items-center gap-2'}>
                      <span className="w-6 text-center text-xs font-semibold text-slate-500">{rowLabel}</span>
                      {rowSeats.map((seat) => {
                        const isSelected = selected.includes(seat.id);
                        const unavailable = seat.status !== 'AVAILABLE';
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            title={`${seat.ticketType.name} · ${seat.rowLabel}${seat.seatNumber} · ${formatMoney(seat.ticketType.priceCents)}`}
                            aria-label={`Assento ${seat.rowLabel}${seat.seatNumber}`}
                            disabled={unavailable}
                            onClick={() => toggleSeat(seat.id)}
                            className={`${seat.ticketType.seatDisplaySize === 'LARGE' ? 'h-12 w-12' : 'h-9 w-9'} rounded-lg text-xs font-semibold transition ${
                              unavailable
                                ? 'cursor-not-allowed bg-rose-400/20 text-rose-200/50'
                                : isSelected
                                  ? 'bg-amber-300 text-slate-950'
                                  : 'bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/35'
                            }`}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
          <Legend color="bg-emerald-400/30" label="Disponível" />
          <Legend color="bg-amber-300" label="Selecionado" />
          <Legend color="bg-rose-400/25" label="Indisponível" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-400">
          {selectedSeats.length ? selectedSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ') : 'Nenhum assento selecionado'}
        </span>
        <strong className="text-lg text-white">{formatMoney(totalCents)}</strong>
      </div>
      {reservationMutation.isError && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">
          {reservationMutation.error instanceof ApiError ? reservationMutation.error.message : 'Não foi possível reservar os assentos.'}
        </p>
      )}
      {!user ? (
        <Link to="/entrar" state={{ from: `/eventos/${event.slug}` }} className="mt-5 block rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950">Entre para reservar</Link>
      ) : user.role === 'CUSTOMER' ? (
        <button type="button" onClick={() => reservationMutation.mutate()} disabled={selected.length === 0 || reservationMutation.isPending} className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
          {reservationMutation.isPending ? 'Reservando…' : 'Reservar assentos por 10 minutos'}
        </button>
      ) : (
        <p className="mt-5 rounded-xl bg-white/5 p-3 text-sm text-slate-400">A reserva está disponível para contas de cliente.</p>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} />{label}</span>;
}
