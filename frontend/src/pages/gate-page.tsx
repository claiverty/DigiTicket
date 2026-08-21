import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { QrScanner } from '../components/qr-scanner';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { useAuth } from '../hooks/use-auth';
import {
  getGateEvents,
  getGateValidations,
  validateGateTicket,
} from '../services/gate-service';
import type {
  GateValidationResponse,
  TicketValidationResult,
} from '../types/gate';

const resultStyles: Record<TicketValidationResult, string> = {
  VALID: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  INVALID: 'border-rose-200 bg-rose-50 text-rose-800',
  WRONG_EVENT: 'border-amber-200 bg-amber-50 text-amber-800',
  ALREADY_USED: 'border-orange-200 bg-orange-50 text-orange-800',
};

const resultLabels: Record<TicketValidationResult, string> = {
  VALID: 'VÁLIDO',
  INVALID: 'INVÁLIDO',
  WRONG_EVENT: 'EVENTO ERRADO',
  ALREADY_USED: 'JÁ UTILIZADO',
};

export function GatePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<GateValidationResponse | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['gate', 'events'],
    queryFn: () => getGateEvents(token!),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!eventId && eventsQuery.data?.[0]) {
      setEventId(eventsQuery.data[0].id);
    }
  }, [eventId, eventsQuery.data]);

  const validationsQuery = useQuery({
    queryKey: ['gate', 'validations', eventId],
    queryFn: () => getGateValidations(eventId, token!),
    enabled: Boolean(token && eventId),
  });

  const validationMutation = useMutation({
    mutationFn: (value: string) => validateGateTicket(eventId, value, token!),
    onSuccess: async (response) => {
      setResult(response);
      setCode('');
      await queryClient.invalidateQueries({
        queryKey: ['gate', 'validations', eventId],
      });
    },
  });

  const submitCode = (value: string) => {
    const normalized = value.trim();
    if (!eventId || !normalized || validationMutation.isPending) return;

    setResult(null);
    validationMutation.mutate(normalized);
  };

  const selectedEvent = eventsQuery.data?.find((event) => event.id === eventId);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
          Portaria
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">
          Validar ingresso
        </h1>
        <p className="mt-3 text-slate-400">
          Selecione o evento antes de ler o QR Code ou digitar o código manual.
        </p>
      </div>

      {eventsQuery.isPending && (
        <LoadingState label="Carregando eventos da portaria" variant="list" count={2} className="mt-8" />
      )}

      {eventsQuery.isError && (
        <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-4 text-rose-700">
          Não foi possível carregar os eventos da portaria.
        </p>
      )}

      {eventsQuery.data?.length === 0 && (
        <EmptyState title="Nenhum evento publicado está disponível" description="Os eventos aparecerão aqui assim que forem publicados pelo organizador." compact className="mt-8" />
      )}

      {eventsQuery.data && eventsQuery.data.length > 0 && (
        <>
          <label className="mt-8 block max-w-xl text-sm font-bold text-slate-700">
            Evento
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setResult(null);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-500"
            >
              {eventsQuery.data.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} — {event._count.tickets} ingressos
                </option>
              ))}
            </select>
          </label>

          {selectedEvent && (
            <p className="mt-3 text-sm text-slate-400">
              {selectedEvent.venueName} · {selectedEvent.city}/{selectedEvent.state}
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-extrabold text-slate-950">Leitura pela câmera</h2>
              <QrScanner
                disabled={validationMutation.isPending}
                onScan={submitCode}
              />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-extrabold text-slate-950">Entrada manual</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitCode(code);
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <label className="block text-sm font-bold text-slate-700">
                  Código do ingresso
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="DT-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-950 uppercase outline-none focus:border-blue-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!code.trim() || validationMutation.isPending}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validationMutation.isPending ? 'Validando…' : 'Validar ingresso'}
                </button>
              </form>
            </div>
          </div>

          {validationMutation.isError && (
            <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
              {validationMutation.error.message}
            </p>
          )}

          {result && <ValidationResultCard response={result} />}

          <div className="mt-10">
            <h2 className="text-xl font-extrabold text-slate-950">Validações recentes</h2>
            {validationsQuery.isPending && (
              <LoadingState label="Carregando histórico de validações" variant="list" count={2} className="mt-4" />
            )}
            {validationsQuery.data?.length === 0 && (
              <EmptyState title="Nenhuma tentativa registrada" description="As leituras de QR Code e código manual aparecerão aqui." compact className="mt-4" />
            )}
            <div className="mt-4 space-y-3">
              {validationsQuery.data?.map((validation) => (
                <div
                  key={validation.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      {resultLabels[validation.result]}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {validation.ticket
                        ? `${validation.ticket.customer.name} · ${validation.ticket.ticketType.name}`
                        : 'Código não reconhecido'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(validation.createdAt).toLocaleString('pt-BR')} · {validation.method}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ValidationResultCard({ response }: { response: GateValidationResponse }) {
  return (
    <div
      role="status"
      className={`mt-8 rounded-2xl border p-6 ${resultStyles[response.result]}`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">Resultado</p>
      <h2 className="mt-2 text-4xl font-bold">{resultLabels[response.result]}</h2>
      <p className="mt-2">{response.message}</p>
      {response.ticket && (
        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <p>Titular: {response.ticket.customer.name}</p>
          <p>Tipo: {response.ticket.ticketType.name}</p>
          <p>Código: {response.ticket.manualCode}</p>
          <p>Evento: {response.ticket.event.title}</p>
        </div>
      )}
    </div>
  );
}
