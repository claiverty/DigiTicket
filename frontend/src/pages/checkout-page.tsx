import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import { simulatePayment } from '../services/payment-service';
import { getReservation } from '../services/reservation-service';
import type {
  PaymentResult,
  PaymentStatus,
} from '../types/reservation';
import { formatEventDate, formatMoney } from '../utils/event-formatters';

export function CheckoutPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [now, setNow] = useState(Date.now());
  const reservationQuery = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation(id, token!),
    enabled: Boolean(id && token),
  });
  const paymentMutation = useMutation({
    mutationFn: (outcome: PaymentStatus) =>
      simulatePayment(id, outcome, token!),
    onSuccess: async (paymentResult) => {
      setResult(paymentResult);
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

  if (reservationQuery.isPending) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-slate-400">Carregando checkout…</div>;
  }

  if (reservationQuery.isError) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-rose-200">Reserva não encontrada ou sem permissão de acesso.</div>;
  }

  const reservation = result?.reservation ?? reservationQuery.data;

  if (result) {
    const approved = result.payment.status === 'APPROVED';
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className={`rounded-3xl border p-8 sm:p-12 ${approved ? 'border-emerald-300/20 bg-emerald-400/10' : 'border-rose-300/20 bg-rose-400/10'}`}>
          <div className="text-5xl" aria-hidden="true">{approved ? '✓' : '×'}</div>
          <h1 className="mt-5 text-3xl font-semibold text-white">{approved ? 'Pagamento aprovado' : 'Pagamento recusado'}</h1>
          <p className="mt-4 leading-7 text-slate-300">
            {approved
              ? `${result.ticketsCreated} ingresso(s) foram gerados para esta compra.`
              : 'Nenhum ingresso foi gerado e as quantidades retornaram ao estoque.'}
          </p>
          {approved && <p className="mt-3 text-sm text-slate-400">QR Code, código manual e a área “Meus Ingressos” serão adicionados na próxima fase.</p>}
          <p className="mt-6 text-sm font-semibold text-slate-200">Total simulado: {formatMoney(result.payment.amountCents)}</p>
          <Link to="/minhas-reservas" className="mt-8 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Voltar às reservas</Link>
        </div>
      </section>
    );
  }

  if (reservation.status !== 'PENDING_PAYMENT') {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">Reserva já processada</h1>
        <p className="mt-4 text-slate-400">O estado atual desta reserva é {reservation.status}.</p>
        <Link to="/minhas-reservas" className="mt-6 inline-block font-semibold text-emerald-300">Voltar às reservas</Link>
      </section>
    );
  }

  const remainingMs = Math.max(
    0,
    new Date(reservation.expiresAt).getTime() - now,
  );
  const expired = remainingMs === 0;
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1_000);

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <Link to="/minhas-reservas" className="text-sm font-semibold text-emerald-300">← Voltar às reservas</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Checkout</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{reservation.event.title}</h1>
          <p className="mt-3 text-slate-400">{formatEventDate(reservation.event.startDate)} · {reservation.event.venueName}</p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Resumo do pedido</h2>
            <ul className="mt-5 space-y-4">
              {reservation.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-300">{item.quantity}× {item.ticketType.name}</span>
                  <span className="font-medium text-white">{formatMoney(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-between border-t border-white/10 pt-5 text-lg font-semibold">
              <span>Total</span>
              <span className="text-emerald-300">{formatMoney(reservation.totalCents)}</span>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6">
          <h2 className="font-semibold text-amber-100">Pagamento simulado</h2>
          <p className="mt-3 text-sm leading-6 text-amber-50/80">Nenhuma cobrança real será realizada. Não informe dados de cartão.</p>
          <p className="mt-4 text-xs leading-5 text-slate-400">Escolha um resultado para testar o comportamento completo do sistema.</p>
          {!expired && (
            <p className="mt-4 font-mono text-sm text-amber-100">
              Reserva: {String(remainingMinutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
            </p>
          )}

          {paymentMutation.isError && <p role="alert" className="mt-4 rounded-lg bg-rose-400/15 p-3 text-sm text-rose-100">{paymentMutation.error instanceof ApiError ? paymentMutation.error.message : 'Não foi possível processar o pagamento.'}</p>}

          <div className="mt-6 space-y-3">
            <button type="button" disabled={expired || paymentMutation.isPending} onClick={() => paymentMutation.mutate('APPROVED')} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40">{paymentMutation.isPending ? 'Processando…' : 'Simular aprovação'}</button>
            <button type="button" disabled={expired || paymentMutation.isPending} onClick={() => paymentMutation.mutate('DECLINED')} className="w-full rounded-xl border border-rose-300/30 px-4 py-3 font-semibold text-rose-100 disabled:opacity-40">Simular recusa</button>
          </div>
          {expired && <p className="mt-4 text-sm text-rose-200">Esta reserva já expirou.</p>}
        </aside>
      </div>
    </section>
  );
}
