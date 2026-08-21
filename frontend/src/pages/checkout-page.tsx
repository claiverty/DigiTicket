import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { LoadingState } from '../components/loading-state';
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
    return <LoadingState label="Carregando checkout" variant="form" className="" />;
  }

  if (reservationQuery.isError) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-rose-700">Reserva não encontrada ou sem permissão de acesso.</div>;
  }

  const reservation = result?.reservation ?? reservationQuery.data;

  if (result) {
    const approved = result.payment.status === 'APPROVED';
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className={`rounded-3xl border bg-white p-8 shadow-xl shadow-slate-950/5 sm:p-12 ${approved ? 'border-emerald-200' : 'border-rose-200'}`}>
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${approved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`} aria-hidden="true">{approved ? <CheckCircle2 size={32} /> : <XCircle size={32} />}</div>
          <h1 className="mt-5 text-3xl font-extrabold text-slate-950">{approved ? 'Pagamento aprovado' : 'Pagamento recusado'}</h1>
          <p className="mt-4 leading-7 text-slate-600">
            {approved
              ? `${result.ticketsCreated} ingresso(s) foram gerados para esta compra.`
              : 'Nenhum ingresso foi gerado e as quantidades retornaram ao estoque.'}
          </p>
          {approved && <p className="mt-3 text-sm text-slate-500">O QR Code e o código manual já estão disponíveis em “Meus Ingressos”.</p>}
          <p className="mt-6 text-sm font-bold text-slate-800">Total simulado: {formatMoney(result.payment.amountCents)}</p>
          <Link to={approved ? '/meus-ingressos' : '/minhas-reservas'} className="mt-8 inline-block rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">{approved ? 'Abrir meus ingressos' : 'Voltar às reservas'}</Link>
        </div>
      </section>
    );
  }

  if (reservation.status !== 'PENDING_PAYMENT') {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-slate-950">Reserva já processada</h1>
        <p className="mt-4 text-slate-500">O estado atual desta reserva é {reservation.status}.</p>
        <Link to="/minhas-reservas" className="mt-6 inline-block font-bold text-blue-700">Voltar às reservas</Link>
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
      <Link to="/minhas-reservas" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={17} /> Voltar às reservas</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Checkout seguro</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">{reservation.event.title}</h1>
          <p className="mt-3 text-slate-500">{formatEventDate(reservation.event.startDate)} · {reservation.event.venueName}</p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">Resumo do pedido</h2>
            <ul className="mt-5 space-y-4">
              {reservation.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600">{item.quantity}× {item.ticketType.name}</span>
                  <span className="font-bold text-slate-950">{formatMoney(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            {reservation.heldSeats.length > 0 && (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Assentos: {reservation.heldSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ')}
              </p>
            )}
            <div className="mt-6 flex justify-between border-t border-slate-200 pt-5 text-lg font-extrabold">
              <span>Total</span>
              <span className="text-blue-700">{formatMoney(reservation.totalCents)}</span>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="flex items-center gap-2 font-extrabold text-slate-950"><CreditCard size={19} className="text-blue-600" /> Pagamento simulado</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Nenhuma cobrança real será realizada. Não informe dados de cartão.</p>
          <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={16} className="shrink-0 text-blue-600" /> Escolha um resultado para testar o comportamento completo do sistema.</p>
          {!expired && (
            <p className="mt-4 inline-flex items-center gap-2 font-mono text-sm font-bold text-blue-700">
              <Clock3 size={16} /> Reserva: {String(remainingMinutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
            </p>
          )}

          {paymentMutation.isError && <p role="alert" className="mt-4 rounded-lg bg-rose-100 p-3 text-sm text-rose-700">{paymentMutation.error instanceof ApiError ? paymentMutation.error.message : 'Não foi possível processar o pagamento.'}</p>}

          <div className="mt-6 space-y-3">
            <button type="button" disabled={expired || paymentMutation.isPending} onClick={() => paymentMutation.mutate('APPROVED')} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-40">{paymentMutation.isPending ? 'Processando…' : 'Simular aprovação'}</button>
            <button type="button" disabled={expired || paymentMutation.isPending} onClick={() => paymentMutation.mutate('DECLINED')} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40">Simular recusa</button>
          </div>
          {expired && <p className="mt-4 text-sm text-rose-700">Esta reserva já expirou.</p>}
        </aside>
      </div>
    </section>
  );
}
