import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { EmptyState } from '../components/empty-state';
import { LoadingState } from '../components/loading-state';
import { useAuth } from '../hooks/use-auth';
import {
  ticketTypeSchema,
  type TicketTypeFormData,
} from '../schemas/ticket-type-schema';
import { ApiError } from '../services/api';
import { getOrganizerEvent } from '../services/event-service';
import {
  createTicketType,
  deleteTicketType,
  getTicketTypes,
  updateTicketType,
} from '../services/ticket-type-service';
import type { TicketType, TicketTypeInput } from '../types/event';
import { formatMoney } from '../utils/event-formatters';

const emptyForm: TicketTypeFormData = {
  name: '',
  description: '',
  priceReais: 0,
  capacity: 1,
};

const ticketPresets = [
  {
    name: 'Pista — Inteira',
    sector: 'Pista',
    priceType: 'Inteira',
    description: 'Ingresso com valor integral para acesso ao setor pista, sem lugar marcado.',
  },
  {
    name: 'Pista — Meia',
    sector: 'Pista',
    priceType: 'Meia-entrada',
    description: 'Meia-entrada para o setor pista, mediante comprovação na entrada.',
  },
  {
    name: 'Pista VIP — Inteira',
    sector: 'Pista VIP',
    priceType: 'Inteira',
    description: 'Ingresso com valor integral para a área VIP, com espaço exclusivo e visão privilegiada.',
  },
  {
    name: 'Pista VIP — Meia',
    sector: 'Pista VIP',
    priceType: 'Meia-entrada',
    description: 'Meia-entrada para a área VIP, mediante comprovação na entrada.',
  },
  {
    name: 'Camarote — Inteira',
    sector: 'Camarote',
    priceType: 'Inteira',
    description: 'Ingresso com valor integral para o camarote ou espaço reservado do evento.',
  },
  {
    name: 'Camarote — Meia',
    sector: 'Camarote',
    priceType: 'Meia-entrada',
    description: 'Meia-entrada para o camarote, mediante comprovação na entrada.',
  },
  {
    name: 'Lote promocional',
    sector: 'Lote',
    priceType: 'Promocional',
    description: 'Valor promocional por tempo ou quantidade limitada.',
  },
] as const;

const sectorOrder = ['Pista', 'Pista VIP', 'Camarote', 'Lote'] as const;

function compareTicketTypes(first: TicketType, second: TicketType) {
  const [firstSector = first.name, firstPriceType = ''] = first.name
    .split('—')
    .map((part) => part.trim());
  const [secondSector = second.name, secondPriceType = ''] = second.name
    .split('—')
    .map((part) => part.trim());
  const firstSectorIndex = sectorOrder.findIndex((sector) => sector === firstSector);
  const secondSectorIndex = sectorOrder.findIndex((sector) => sector === secondSector);
  const normalizedFirstIndex = firstSectorIndex === -1 ? sectorOrder.length : firstSectorIndex;
  const normalizedSecondIndex = secondSectorIndex === -1 ? sectorOrder.length : secondSectorIndex;

  if (normalizedFirstIndex !== normalizedSecondIndex) {
    return normalizedFirstIndex - normalizedSecondIndex;
  }

  const sectorComparison = firstSector.localeCompare(secondSector, 'pt-BR');
  if (sectorComparison !== 0) return sectorComparison;

  const priceTypeOrder = (priceType: string) => {
    if (priceType.includes('Inteira')) return 0;
    if (priceType.includes('Meia')) return 1;
    return 2;
  };
  const priceTypeComparison = priceTypeOrder(firstPriceType) - priceTypeOrder(secondPriceType);

  return priceTypeComparison || first.name.localeCompare(second.name, 'pt-BR');
}

export function TicketTypesPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);
  const eventQuery = useQuery({
    queryKey: ['events', 'organizer', id],
    queryFn: () => getOrganizerEvent(id, token!),
    enabled: Boolean(id && token),
  });
  const ticketTypesQuery = useQuery({
    queryKey: ['ticket-types', id],
    queryFn: () => getTicketTypes(id, token!),
    enabled: Boolean(id && token),
  });
  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketTypeFormData>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: emptyForm,
  });
  const selectedTicketName = watch('name');

  useEffect(() => {
    if (!editing) {
      reset(emptyForm);
      return;
    }

    reset({
      name: editing.name,
      description: editing.description ?? '',
      priceReais: editing.priceCents / 100,
      capacity: editing.capacity,
    });
  }, [editing, reset]);

  useEffect(() => {
    if (!editing) return;

    const previousOverflow = document.body.style.overflow;
    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditing(null);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleDialogKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKeyboard);
      editTriggerRef.current?.focus();
    };
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: (input: TicketTypeInput) =>
      editing
        ? updateTicketType(id, editing.id, input, token!)
        : createTicketType(id, input, token!),
    onSuccess: async () => {
      setEditing(null);
      reset(emptyForm);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticket-types', id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (ticketTypeId: string) =>
      deleteTicketType(id, ticketTypeId, token!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticket-types', id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    try {
      await saveMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        priceCents: Math.round(data.priceReais * 100),
        capacity: data.capacity,
      });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar o tipo de ingresso.',
      );
    }
  });

  const applyPreset = (preset: (typeof ticketPresets)[number]) => {
    setSubmitError(null);

    if (selectedTicketName === preset.name) {
      reset(emptyForm);
      return;
    }

    reset({
      ...emptyForm,
      name: preset.name,
      description: preset.description,
    });
  };

  const remove = async (ticketType: TicketType) => {
    if (!window.confirm(`Excluir o ingresso “${ticketType.name}”?`)) return;
    setSubmitError(null);

    try {
      await deleteMutation.mutateAsync(ticketType.id);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível excluir o tipo de ingresso.',
      );
    }
  };

  if (eventQuery.isPending || ticketTypesQuery.isPending) {
    return <LoadingState label="Carregando tipos de ingresso" variant="form" className="" />;
  }

  if (eventQuery.isError || ticketTypesQuery.isError) {
    return <div className="mx-auto max-w-6xl px-6 py-20 text-rose-700">Evento não encontrado ou sem permissão de acesso.</div>;
  }

  const event = eventQuery.data;
  const ticketTypes = ticketTypesQuery.data;
  const orderedTicketTypes = [...ticketTypes].sort(compareTicketTypes);

  if (event.saleMode !== 'GENERAL_ADMISSION') {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar</Link>
        <h1 className="mt-5 text-3xl font-extrabold text-slate-950">Assentos reservados</h1>
        <p className="mt-4 text-slate-400">Este evento usará mapa de assentos, que será implementado em uma fase posterior.</p>
      </section>
    );
  }

  const ticketForm = (
    <form
      onSubmit={onSubmit}
      className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="ticket-form-title" className="text-xl font-extrabold text-slate-950">
          {editing ? 'Editar ingresso' : 'Novo ingresso'}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            aria-label="Fechar edição"
            className="grid size-9 place-items-center rounded-full bg-slate-100 text-xl leading-none text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            ×
          </button>
        )}
      </div>
      {!editing && (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-700">Modelos rápidos</span>
            <span className="text-xs font-semibold text-slate-400">Opcional</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ticketPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-pressed={selectedTicketName === preset.name}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                  selectedTicketName === preset.name
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <span className="block">{preset.sector}</span>
                <span className="mt-0.5 block text-xs font-semibold opacity-70">{preset.priceType}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">O modelo preenche o nome e a descrição. Você define o preço e a quantidade.</p>
        </div>
      )}
      <FormField id="name" label="Nome" placeholder="Pista, VIP, Meia…" autoFocus={Boolean(editing)} error={errors.name?.message} {...register('name')} />
      <label htmlFor="ticket-description">
        <span className="mb-2 block text-sm font-bold text-slate-700">Descrição (opcional)</span>
        <textarea id="ticket-description" rows={3} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'ticket-description-error' : undefined} {...register('description')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500" />
        {errors.description && <span id="ticket-description-error" role="alert" className="mt-2 block text-sm text-rose-700">{errors.description.message}</span>}
      </label>
      <FormField
        id="priceReais"
        label="Preço (R$)"
        type="number"
        min="0"
        step="0.01"
        onFocus={(event) => {
          if (event.currentTarget.value === '0') event.currentTarget.select();
        }}
        error={errors.priceReais?.message}
        {...register('priceReais', { valueAsNumber: true })}
      />
      <p className="-mt-3 text-xs leading-5 text-slate-400">Informe o valor final deste ingresso. Use R$ 0,00 somente para eventos gratuitos.</p>
      <FormField id="capacity" label="Capacidade" type="number" min="1" step="1" error={errors.capacity?.message} {...register('capacity', { valueAsNumber: true })} />
      <p className="-mt-3 text-xs leading-5 text-slate-400">Quantidade total disponível para esta categoria ou lote.</p>
      {submitError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{submitError}</p>}
      <div className="flex gap-2">
        {editing && <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button>}
        <button type="submit" disabled={saveMutation.isPending} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saveMutation.isPending ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar aos eventos</Link>
      <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Ingressos de {event.title}</h1>
      <p className="mt-3 text-slate-500">Escolha um modelo rápido ou crie uma categoria própria para configurar preço e quantidade.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-4">
          {ticketTypes.length === 0 && (
            <EmptyState title="Nenhum tipo de ingresso cadastrado" description="Use o formulário ao lado para criar o primeiro lote deste evento." compact className="" />
          )}
          {orderedTicketTypes.map((ticketType) => {
            const reserved = ticketType.capacity - ticketType.availableQuantity;
            const occupiedPercentage = Math.min(
              100,
              Math.round((reserved / ticketType.capacity) * 100),
            );
            return (
              <article key={ticketType.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-extrabold text-slate-950">{ticketType.name}</h2>
                    <p className="mt-1 font-bold text-blue-700">{formatMoney(ticketType.priceCents)}</p>
                    {ticketType.description && <p className="mt-2 line-clamp-1 text-sm text-slate-400">{ticketType.description}</p>}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="shrink-0 text-sm text-slate-600">{ticketType.availableQuantity} disponíveis de {ticketType.capacity} · {reserved} reservados</p>
                      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={occupiedPercentage} aria-label={`${occupiedPercentage}% dos ingressos reservados`} className="h-1.5 w-full max-w-52 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${occupiedPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={(event) => { editTriggerRef.current = event.currentTarget; setEditing(ticketType); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">Editar</button>
                    <button type="button" onClick={() => void remove(ticketType)} disabled={reserved > 0 || deleteMutation.isPending} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">Excluir</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!editing && ticketForm}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div aria-hidden="true" onMouseDown={() => setEditing(null)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ticket-form-title" className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl">
            {ticketForm}
          </div>
        </div>
      )}
    </section>
  );
}
