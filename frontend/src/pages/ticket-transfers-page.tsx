import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import {
  acceptTicketTransfer,
  cancelTicketTransfer,
  declineTicketTransfer,
  getIncomingTicketTransfers,
  getOutgoingTicketTransfers,
} from '../services/ticket-transfer-service';
import type {
  TicketTransfer,
  TicketTransferStatus,
} from '../types/ticket-transfer';
import { formatEventDate } from '../utils/event-formatters';

type TransferAction = 'accept' | 'decline' | 'cancel';

const statusLabels: Record<TicketTransferStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  CANCELLED: 'Cancelada',
  DECLINED: 'Recusada',
};

export function TicketTransfersPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const incomingQuery = useQuery({
    queryKey: ['ticket-transfers', 'incoming'],
    queryFn: () => getIncomingTicketTransfers(token!),
    enabled: Boolean(token),
  });
  const outgoingQuery = useQuery({
    queryKey: ['ticket-transfers', 'outgoing'],
    queryFn: () => getOutgoingTicketTransfers(token!),
    enabled: Boolean(token),
  });
  const actionMutation = useMutation({
    mutationFn: ({ action, id }: { action: TransferAction; id: string }) => {
      if (action === 'accept') return acceptTicketTransfer(id, token!);
      if (action === 'decline') return declineTicketTransfer(id, token!);
      return cancelTicketTransfer(id, token!);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticket-transfers'] }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      ]);
    },
  });

  const incoming = incomingQuery.data ?? [];
  const outgoing = outgoingQuery.data ?? [];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
        Cliente
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
        Transferências
      </h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Aceite ingressos recebidos ou acompanhe solicitações enviadas para outras contas.
      </p>

      {actionMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-rose-200">
          {actionMutation.error.message}
        </p>
      )}

      <TransferSection
        title="Recebidas"
        emptyMessage="Nenhuma transferência foi enviada para você."
        loading={incomingQuery.isPending}
        error={incomingQuery.isError}
        transfers={incoming}
        direction="incoming"
        pendingAction={actionMutation.isPending}
        onAction={(action, id) => actionMutation.mutate({ action, id })}
      />

      <TransferSection
        title="Enviadas"
        emptyMessage="Você ainda não enviou nenhum ingresso."
        loading={outgoingQuery.isPending}
        error={outgoingQuery.isError}
        transfers={outgoing}
        direction="outgoing"
        pendingAction={actionMutation.isPending}
        onAction={(action, id) => actionMutation.mutate({ action, id })}
      />
    </section>
  );
}

function TransferSection({
  title,
  emptyMessage,
  loading,
  error,
  transfers,
  direction,
  pendingAction,
  onAction,
}: {
  title: string;
  emptyMessage: string;
  loading: boolean;
  error: boolean;
  transfers: TicketTransfer[];
  direction: 'incoming' | 'outgoing';
  pendingAction: boolean;
  onAction: (action: TransferAction, id: string) => void;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {loading && <p className="mt-4 text-slate-400">Carregando…</p>}
      {error && (
        <p className="mt-4 text-rose-200">Não foi possível carregar esta lista.</p>
      )}
      {!loading && !error && transfers.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-slate-400">
          {emptyMessage}
        </p>
      )}
      <div className="mt-4 space-y-4">
        {transfers.map((transfer) => (
          <article
            key={transfer.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                    {statusLabels[transfer.status]}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(transfer.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {transfer.ticket.event.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {transfer.ticket.ticketType.name} · {formatEventDate(transfer.ticket.event.startDate)}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {direction === 'incoming'
                    ? `Enviado por ${transfer.sender.name} (${transfer.sender.email})`
                    : `Enviado para ${transfer.recipient.name} (${transfer.recipient.email})`}
                </p>
              </div>

              {transfer.status === 'PENDING' && direction === 'incoming' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pendingAction}
                    onClick={() => onAction('accept', transfer.id)}
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    disabled={pendingAction}
                    onClick={() => onAction('decline', transfer.id)}
                    className="rounded-lg border border-rose-300/20 px-4 py-2 text-sm text-rose-200 disabled:opacity-50"
                  >
                    Recusar
                  </button>
                </div>
              )}

              {transfer.status === 'PENDING' && direction === 'outgoing' && (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={() => onAction('cancel', transfer.id)}
                  className="rounded-lg border border-amber-300/20 px-4 py-2 text-sm text-amber-200 disabled:opacity-50"
                >
                  Cancelar solicitação
                </button>
              )}

              {transfer.status === 'ACCEPTED' &&
                direction === 'incoming' && (
                  <Link
                    to={`/meus-ingressos/${transfer.ticket.id}`}
                    className="text-sm font-semibold text-emerald-300"
                  >
                    Abrir ingresso →
                  </Link>
                )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
