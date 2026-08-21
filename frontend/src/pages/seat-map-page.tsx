import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import { getOrganizerEvent } from '../services/event-service';
import { createSeatSection, deleteSeatSection, getOrganizerSeats, updateSeatSectionSize } from '../services/seating-service';
import { formatMoney } from '../utils/event-formatters';

export function SeatMapPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('Plateia');
  const [priceReais, setPriceReais] = useState(50);
  const [rows, setRows] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [seatDisplaySize, setSeatDisplaySize] = useState<'STANDARD' | 'LARGE'>('STANDARD');
  const eventQuery = useQuery({
    queryKey: ['events', 'organizer', id],
    queryFn: () => getOrganizerEvent(id, token!),
    enabled: Boolean(id && token),
  });
  const seatsQuery = useQuery({
    queryKey: ['seats', 'organizer', id],
    queryFn: () => getOrganizerSeats(id, token!),
    enabled: Boolean(id && token),
  });
  const saveMutation = useMutation({
    mutationFn: () => createSeatSection(id, { name, priceCents: Math.round(priceReais * 100), rows, seatsPerRow, seatDisplaySize }, token!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seats', 'organizer', id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (ticketTypeId: string) => deleteSeatSection(id, ticketTypeId, token!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seats', 'organizer', id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
    },
  });
  const sizeMutation = useMutation({
    mutationFn: ({ ticketTypeId, size }: { ticketTypeId: string; size: 'STANDARD' | 'LARGE' }) => updateSeatSectionSize(id, ticketTypeId, size, token!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['seats', 'organizer', id] });
    },
  });

  if (eventQuery.isPending || seatsQuery.isPending) return <LoadingState label="Carregando mapa de assentos" variant="form" className="" />;
  if (eventQuery.isError || seatsQuery.isError) return <div className="mx-auto max-w-6xl px-6 py-20 text-rose-700">Evento não encontrado ou o mapa não pode ser alterado.</div>;

  const seats = seatsQuery.data;
  const sections = [...new Map(seats.map((seat) => [seat.ticketType.id, seat.ticketType])).values()];
  const sectionRows = seats.reduce((grouped, seat) => {
    const rowsByLabel = grouped.get(seat.ticketTypeId) ?? new Map<string, typeof seats>();
    const row = rowsByLabel.get(seat.rowLabel) ?? [];
    row.push(seat);
    rowsByLabel.set(seat.rowLabel, row);
    grouped.set(seat.ticketTypeId, rowsByLabel);
    return grouped;
  }, new Map<string, Map<string, typeof seats>>());
  const mutationError = saveMutation.error ?? deleteMutation.error;

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar aos eventos</Link>
      <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Mapa de {eventQuery.data.title}</h1>
      <p className="mt-3 text-slate-400">Crie setores; as fileiras e cadeiras serão numeradas automaticamente.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="rounded-2xl bg-[#0b132b] p-5 text-white sm:p-7">
          <div className="mx-auto mb-8 max-w-lg rounded-b-[50%] border-t-4 border-emerald-400 pt-3 text-center text-xs uppercase tracking-[0.25em] text-slate-400">Palco</div>
          {seats.length === 0 ? (
            <EmptyState title="Mapa ainda não configurado" description="Adicione o primeiro setor para gerar automaticamente as fileiras e os assentos." compact className="my-10" />
          ) : (
            <div className="overflow-x-auto">
              <div className="mx-auto w-max space-y-8">
                {sections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{section.name} · {formatMoney(section.priceCents)}</p>
                    <div className={section.seatDisplaySize === 'LARGE' ? 'space-y-3' : 'space-y-2'}>
                      {[...(sectionRows.get(section.id) ?? new Map<string, typeof seats>()).entries()].map(([rowLabel, rowSeats]) => (
                        <div key={rowLabel} className={section.seatDisplaySize === 'LARGE' ? 'flex items-center gap-3' : 'flex items-center gap-2'}>
                          <span className="w-6 text-center text-xs text-slate-400">{rowLabel}</span>
                          {rowSeats.map((seat) => <span key={seat.id} title={seat.ticketType.name} className={`flex items-center justify-center rounded-lg border border-blue-300/15 bg-blue-500/20 text-xs font-semibold text-blue-100 shadow-inner ${section.seatDisplaySize === 'LARGE' ? 'h-12 w-12 bg-blue-500/35' : 'h-9 w-9'}`}>{seat.seatNumber}</span>)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
          {sections.length > 0 && (
            <div className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold text-slate-950">Setores configurados</h2>
              <div className="mt-3 space-y-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                    <span className="font-semibold text-slate-700">{section.name} · {formatMoney(section.priceCents)}</span>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={sizeMutation.isPending} onClick={() => sizeMutation.mutate({ ticketTypeId: section.id, size: section.seatDisplaySize === 'LARGE' ? 'STANDARD' : 'LARGE' })} className="rounded-lg border border-blue-200 px-3 py-1.5 font-semibold text-blue-700">
                        {section.seatDisplaySize === 'LARGE' ? 'Usar tamanho padrão' : 'Usar tamanho VIP'}
                      </button>
                      <button type="button" disabled={deleteMutation.isPending} onClick={() => window.confirm(`Excluir o setor “${section.name}” e seus assentos?`) && deleteMutation.mutate(section.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-rose-700">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-950">Novo setor</h2>
          <FormField id="section-name" label="Nome" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
          <FormField id="section-price" label="Preço (R$)" type="number" value={priceReais} onChange={(event) => setPriceReais(Number(event.target.value))} min={0} step="0.01" required />
          <FormField id="section-rows" label="Quantidade de fileiras" type="number" value={rows} onChange={(event) => setRows(Number(event.target.value))} min={1} max={26} required />
          <FormField id="section-seats" label="Assentos por fileira" type="number" value={seatsPerRow} onChange={(event) => setSeatsPerRow(Number(event.target.value))} min={1} max={50} required />
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Tamanho visual</span>
            <select value={seatDisplaySize} onChange={(event) => setSeatDisplaySize(event.target.value as 'STANDARD' | 'LARGE')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500">
              <option value="STANDARD">Padrão</option>
              <option value="LARGE">Confortável / VIP</option>
            </select>
          </label>
          <p className="text-sm text-slate-400">Este setor criará {Math.max(0, rows * seatsPerRow)} assentos.</p>
          {mutationError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{mutationError instanceof ApiError ? mutationError.message : 'Não foi possível alterar o mapa.'}</p>}
          <button type="submit" disabled={saveMutation.isPending} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">{saveMutation.isPending ? 'Gerando…' : 'Adicionar setor'}</button>
        </form>
      </div>
    </section>
  );
}
