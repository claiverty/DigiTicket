import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import { createReservation } from '../services/reservation-service';
import type { Event, TicketType } from '../types/event';
import { formatMoney } from '../utils/event-formatters';
import { SeatSelection } from './seat-selection';

export function TicketSelection({ event }: { event: Event }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const reservationMutation = useMutation({
    mutationFn: () =>
      createReservation(
        event.id,
        {
          items: Object.entries(quantities)
            .filter(([, quantity]) => quantity > 0)
            .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })),
        },
        token!,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'public'] }),
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
      ]);
      navigate('/minhas-reservas');
    },
  });
  const ticketTypes = event.ticketTypes ?? [];
  const totalCents = ticketTypes.reduce(
    (total, ticketType) =>
      total + ticketType.priceCents * (quantities[ticketType.id] ?? 0),
    0,
  );
  const selectedQuantity = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );

  const changeQuantity = (ticketType: TicketType, difference: number) => {
    setQuantities((current) => {
      const quantity = Math.max(
        0,
        Math.min(
          ticketType.availableQuantity,
          (current[ticketType.id] ?? 0) + difference,
        ),
      );
      return { ...current, [ticketType.id]: quantity };
    });
  };

  if (event.saleMode !== 'GENERAL_ADMISSION') {
    return <SeatSelection event={event} />;
  }

  if (ticketTypes.length === 0) {
    return <div className="mt-6 rounded-xl bg-white/5 p-4 text-sm text-slate-400">Os ingressos ainda não foram disponibilizados.</div>;
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h2 className="text-lg font-semibold text-white">Escolha seus ingressos</h2>
      <div className="mt-4 space-y-4">
        {ticketTypes.map((ticketType) => {
          const quantity = quantities[ticketType.id] ?? 0;
          return (
            <div key={ticketType.id} className="rounded-xl bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{ticketType.name}</h3>
                  <p className="mt-1 text-sm text-emerald-300">{formatMoney(ticketType.priceCents)}</p>
                  <p className="mt-1 text-xs text-slate-500">{ticketType.availableQuantity > 0 ? `${ticketType.availableQuantity} disponíveis` : 'Esgotado'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label={`Remover ${ticketType.name}`} onClick={() => changeQuantity(ticketType, -1)} disabled={quantity === 0} className="h-8 w-8 rounded-lg border border-white/10 disabled:opacity-30">−</button>
                  <span className="w-5 text-center font-semibold">{quantity}</span>
                  <button type="button" aria-label={`Adicionar ${ticketType.name}`} onClick={() => changeQuantity(ticketType, 1)} disabled={quantity >= ticketType.availableQuantity} className="h-8 w-8 rounded-lg border border-white/10 disabled:opacity-30">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-slate-400">{selectedQuantity} ingresso(s)</span>
        <strong className="text-lg text-white">{formatMoney(totalCents)}</strong>
      </div>
      {reservationMutation.isError && <p role="alert" className="mt-4 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">{reservationMutation.error instanceof ApiError ? reservationMutation.error.message : 'Não foi possível criar a reserva.'}</p>}

      {!user ? (
        <Link to="/entrar" state={{ from: `/eventos/${event.slug}` }} className="mt-5 block rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950">Entre para reservar</Link>
      ) : user.role === 'CUSTOMER' ? (
        <button type="button" onClick={() => reservationMutation.mutate()} disabled={selectedQuantity === 0 || reservationMutation.isPending} className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{reservationMutation.isPending ? 'Reservando…' : 'Reservar por 10 minutos'}</button>
      ) : (
        <p className="mt-5 rounded-xl bg-white/5 p-3 text-sm text-slate-400">A reserva está disponível para contas de cliente.</p>
      )}
    </div>
  );
}
