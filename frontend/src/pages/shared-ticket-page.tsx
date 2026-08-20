import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { TicketView } from '../components/ticket-view';
import { getSharedTicket } from '../services/ticket-service';

export function SharedTicketPage() {
  const { shareToken = '' } = useParams();
  const ticketQuery = useQuery({
    queryKey: ['tickets', 'shared', shareToken],
    queryFn: () => getSharedTicket(shareToken),
    enabled: Boolean(shareToken),
    retry: false,
  });

  if (ticketQuery.isPending) {
    return <div className="mx-auto max-w-5xl px-6 py-20 text-slate-400">Carregando ingresso compartilhado…</div>;
  }

  if (ticketQuery.isError) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">Link inválido ou revogado</h1>
        <p className="mt-4 text-slate-400">Solicite um novo link ao proprietário do ingresso.</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-emerald-300">Conhecer o DigiTicket</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <p className="mb-5 text-center text-sm text-slate-400">Visualização compartilhada · a propriedade do ingresso não foi transferida</p>
      <TicketView ticket={ticketQuery.data} />
    </section>
  );
}
