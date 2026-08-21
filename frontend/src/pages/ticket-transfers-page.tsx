import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
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
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Movimentações</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Transferências</h1><p className="mt-3 max-w-2xl text-slate-500">Receba ingressos de outra conta ou acompanhe os acessos que você enviou.</p></div><Link to="/meus-ingressos" className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700">Minha carteira <ArrowRight size={15} /></Link></div>

      {actionMutation.isError && (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
          {actionMutation.error.message}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-6">
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
      </div>
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
    <div className="mt-8">
      <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${direction === 'incoming' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{direction === 'incoming' ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}</span><div><h2 className="text-xl font-extrabold text-slate-950">{title}</h2><p className="text-xs text-slate-400">{transfers.length} {transfers.length === 1 ? 'movimentação' : 'movimentações'}</p></div></div>
      {loading && <LoadingState label={`Carregando transferências ${title.toLowerCase()}`} variant="list" count={2} className="mt-4" />}
      {error && (
        <p className="mt-4 text-rose-700">Não foi possível carregar esta lista.</p>
      )}
      {!loading && !error && transfers.length === 0 && (
        <EmptyState title={emptyMessage} compact className="mt-4" />
      )}
      <div className="mt-5 space-y-3">
        {transfers.map((transfer) => (
          <article
            key={transfer.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_38px_-34px_rgba(15,23,42,0.5)]"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${transfer.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : transfer.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[transfer.status]}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(transfer.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                  {transfer.ticket.event.title}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><CalendarDays size={14} className="text-slate-400" />{transfer.ticket.ticketType.name} · {formatEventDate(transfer.ticket.event.startDate)}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><UserRound size={14} />
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
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    disabled={pendingAction}
                    onClick={() => onAction('decline', transfer.id)}
                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:opacity-50"
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
                  className="rounded-lg border border-amber-200 px-4 py-2 text-sm text-amber-700 disabled:opacity-50"
                >
                  Cancelar solicitação
                </button>
              )}

              {transfer.status === 'ACCEPTED' &&
                direction === 'incoming' && (
                  <Link
                    to={`/meus-ingressos/${transfer.ticket.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700"
                  >
                    Abrir ingresso <ArrowRight size={14} />
                  </Link>
                )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
