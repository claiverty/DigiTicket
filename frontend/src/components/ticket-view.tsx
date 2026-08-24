import { TicketQrCode } from './ticket-qr-code';
import { CalendarDays, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import type { TicketDisplay, TicketStatus } from '../types/ticket';
import { formatEventDate } from '../utils/event-formatters';

const statusLabels: Record<TicketStatus, string> = {
  ACTIVE: 'Ativo',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};

export function TicketView({ ticket }: { ticket: TicketDisplay }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
      <div className="relative h-64 bg-[#102856] sm:h-72">
        {ticket.event.posterUrl && <img src={ticket.event.posterUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a3d] via-[#071a3d]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{statusLabels[ticket.status]}</span>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">{ticket.event.title}</h1>
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[1fr_20rem]">
        <div className="p-6 sm:p-8 lg:p-10">
          <dl className="grid gap-5 sm:grid-cols-2">
            <TicketData label="Titular" value={ticket.customer.name} icon={UserRound} />
            <TicketData label="Tipo" value={ticket.ticketType.name} />
            {ticket.seat && <TicketData label="Assento" value={`${ticket.seat.rowLabel}${ticket.seat.seatNumber}`} />}
            <TicketData label="Data" value={formatEventDate(ticket.event.startDate)} icon={CalendarDays} />
            <TicketData label="Local" value={`${ticket.event.venueName} · ${ticket.event.city}/${ticket.event.state}`} icon={MapPin} />
          </dl>
          <div className="mt-8 rounded-2xl bg-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Código manual</p>
            <p className="mt-2 font-mono text-xl font-bold tracking-wider text-blue-800">{ticket.manualCode}</p>
          </div>
          <p className="mt-5 flex gap-2 text-sm leading-6 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={17} /> Apresente o QR Code ou o código manual na portaria. A validação confirma a autenticidade e o status do ingresso.</p>
        </div>

        <div className="relative flex flex-col items-center justify-center border-t border-dashed border-slate-300 bg-slate-50 p-7 text-slate-950 lg:border-l lg:border-t-0">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border-b border-r border-slate-200 bg-[#f7f9fc] lg:-left-3 lg:-top-3" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border-b border-l border-slate-200 bg-[#f7f9fc] lg:-bottom-3 lg:-left-3 lg:right-auto lg:top-auto" />
          <div className="rounded-2xl bg-white p-3 shadow-sm"><TicketQrCode value={ticket.qrToken} /></div>
          <p className="mt-3 text-center text-xs font-bold text-slate-600">Aponte este código na entrada</p>
          <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-slate-400">Ingresso digital assinado</p>
        </div>
      </div>
      {ticket.pendingTransfer && (
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 sm:px-8">
          Transferência pendente para {ticket.pendingTransfer.recipient.name}. Este ingresso fica bloqueado na portaria até a solicitação ser finalizada.
        </div>
      )}
    </article>
  );
}

function TicketData({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarDays }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{Icon && <Icon size={13} className="text-blue-600" />}{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
