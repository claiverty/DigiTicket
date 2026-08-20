import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { QrScanner } from '../components/qr-scanner';
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
  VALID: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  INVALID: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  WRONG_EVENT: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  ALREADY_USED: 'border-orange-300/30 bg-orange-400/10 text-orange-100',
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Portaria
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Validar ingresso
        </h1>
        <p className="mt-3 text-slate-400">
          Selecione o evento antes de ler o QR Code ou digitar o código manual.
        </p>
      </div>

      {eventsQuery.isPending && (
        <p className="mt-8 text-slate-400">Carregando eventos…</p>
      )}

      {eventsQuery.isError && (
        <p role="alert" className="mt-8 rounded-xl bg-rose-400/10 p-4 text-rose-200">
          Não foi possível carregar os eventos da portaria.
        </p>
      )}

      {eventsQuery.data?.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-white/15 p-8 text-center text-slate-400">
          Nenhum evento publicado está disponível.
        </p>
      )}

      {eventsQuery.data && eventsQuery.data.length > 0 && (
        <>
          <label className="mt-8 block max-w-xl text-sm font-medium text-slate-200">
            Evento
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setResult(null);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-300/50"
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
              <h2 className="mb-3 text-lg font-semibold text-white">Leitura pela câmera</h2>
              <QrScanner
                disabled={validationMutation.isPending}
                onScan={submitCode}
              />
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">Entrada manual</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitCode(code);
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <label className="block text-sm font-medium text-slate-200">
                  Código do ingresso
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="DT-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-white uppercase outline-none focus:border-emerald-300/50"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!code.trim() || validationMutation.isPending}
                  className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validationMutation.isPending ? 'Validando…' : 'Validar ingresso'}
                </button>
              </form>
            </div>
          </div>

          {validationMutation.isError && (
            <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-rose-200">
              {validationMutation.error.message}
            </p>
          )}

          {result && <ValidationResultCard response={result} />}

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white">Validações recentes</h2>
            {validationsQuery.isPending && (
              <p className="mt-4 text-slate-400">Carregando histórico…</p>
            )}
            {validationsQuery.data?.length === 0 && (
              <p className="mt-4 text-slate-400">Nenhuma tentativa registrada neste evento.</p>
            )}
            <div className="mt-4 space-y-3">
              {validationsQuery.data?.map((validation) => (
                <div
                  key={validation.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
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
