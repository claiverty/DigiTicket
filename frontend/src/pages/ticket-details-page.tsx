import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TicketView } from '../components/ticket-view';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import {
  createTicketShare,
  getTicket,
  revokeTicketShare,
} from '../services/ticket-service';

export function TicketDetailsPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const ticketQuery = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => getTicket(id, token!),
    enabled: Boolean(id && token),
  });
  const shareMutation = useMutation({
    mutationFn: () => createTicketShare(id, token!),
    onSuccess: (ticket) => {
      queryClient.setQueryData(['tickets', id], ticket);
      setNotice('Novo link compartilhável gerado.');
    },
  });
  const revokeMutation = useMutation({
    mutationFn: () => revokeTicketShare(id, token!),
    onSuccess: async () => {
      setNotice('Link revogado. Ele não pode mais ser acessado.');
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  if (ticketQuery.isPending) {
    return <div className="mx-auto max-w-5xl px-6 py-20 text-slate-400">Carregando ingresso…</div>;
  }

  if (ticketQuery.isError) {
    return <div className="mx-auto max-w-5xl px-6 py-20 text-rose-200">Ingresso não encontrado ou sem permissão de acesso.</div>;
  }

  const ticket = ticketQuery.data;
  const shareUrl = ticket.shareToken
    ? `${window.location.origin}/ingresso/compartilhado/${ticket.shareToken}`
    : null;
  const mutationError = shareMutation.error ?? revokeMutation.error;

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setNotice('Link copiado para a área de transferência.');
  };

  const shareTicket = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: `Ingresso — ${ticket.event.title}`,
        text: 'Acesse este ingresso DigiTicket:',
        url: shareUrl,
      });
      return;
    }

    await copyShareUrl();
  };

  const revoke = () => {
    if (window.confirm('Revogar este link compartilhável?')) {
      revokeMutation.mutate();
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <Link to="/meus-ingressos" className="text-sm font-semibold text-emerald-300">← Voltar aos ingressos</Link>
      <div className="mt-6"><TicketView ticket={ticket} /></div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">Compartilhar ingresso</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">O link permite visualizar este ingresso, mas não transfere a propriedade. Gerar um novo link invalida o anterior.</p>

        {shareUrl ? (
          <div className="mt-5">
            <input readOnly value={shareUrl} aria-label="Link compartilhável" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyShareUrl()} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">Copiar link</button>
              <button type="button" onClick={() => void shareTicket()} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Compartilhar</button>
              <button type="button" onClick={() => shareMutation.mutate()} disabled={shareMutation.isPending} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-50">Gerar novo link</button>
              <button type="button" onClick={revoke} disabled={revokeMutation.isPending} className="rounded-lg border border-rose-300/20 px-4 py-2 text-sm text-rose-200 disabled:opacity-50">Revogar link</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => shareMutation.mutate()} disabled={shareMutation.isPending || ticket.status !== 'ACTIVE'} className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{shareMutation.isPending ? 'Gerando…' : 'Gerar link compartilhável'}</button>
        )}

        {notice && <p className="mt-4 text-sm text-emerald-200">{notice}</p>}
        {mutationError && <p role="alert" className="mt-4 text-sm text-rose-200">{mutationError instanceof ApiError ? mutationError.message : 'Não foi possível alterar o compartilhamento.'}</p>}
      </div>
    </section>
  );
}
