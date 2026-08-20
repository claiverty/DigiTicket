import { TicketQrCode } from './ticket-qr-code';
import type { TicketDisplay, TicketStatus } from '../types/ticket';
import { formatEventDate } from '../utils/event-formatters';

const statusLabels: Record<TicketStatus, string> = {
  ACTIVE: 'Ativo',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};

export function TicketView({ ticket }: { ticket: TicketDisplay }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="relative h-56 bg-gradient-to-br from-emerald-400/20 to-indigo-500/10">
        {ticket.event.posterUrl && <img src={ticket.event.posterUrl} alt="" className="h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-emerald-200">{statusLabels[ticket.status]}</span>
          <h1 className="mt-3 text-3xl font-semibold text-white">{ticket.event.title}</h1>
        </div>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_17rem]">
        <div>
          <dl className="grid gap-5 sm:grid-cols-2">
            <TicketData label="Titular" value={ticket.customer.name} />
            <TicketData label="Tipo" value={ticket.ticketType.name} />
            <TicketData label="Data" value={formatEventDate(ticket.event.startDate)} />
            <TicketData label="Local" value={`${ticket.event.venueName} · ${ticket.event.city}/${ticket.event.state}`} />
          </dl>
          <div className="mt-7 rounded-xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Código manual</p>
            <p className="mt-2 font-mono text-xl font-semibold tracking-wider text-white">{ticket.manualCode}</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">Apresente o QR Code ou o código manual na portaria. O banco de dados continuará sendo a fonte final de validação.</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 text-slate-950">
          <TicketQrCode value={ticket.qrToken} />
          <p className="mt-2 text-center text-xs font-medium">Ingresso assinado digitalmente</p>
        </div>
      </div>
    </article>
  );
}

function TicketData({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}
