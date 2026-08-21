import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

export function TicketTypesPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    handleSubmit,
    formState: { errors },
  } = useForm<TicketTypeFormData>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: emptyForm,
  });

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

  if (event.saleMode !== 'GENERAL_ADMISSION') {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar</Link>
        <h1 className="mt-5 text-3xl font-extrabold text-slate-950">Assentos reservados</h1>
        <p className="mt-4 text-slate-400">Este evento usará mapa de assentos, que será implementado em uma fase posterior.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar aos eventos</Link>
      <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">Ingressos de {event.title}</h1>
      <p className="mt-3 text-slate-400">Configure preço e estoque. Valores são armazenados em centavos no servidor.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-4">
          {ticketTypes.length === 0 && (
            <EmptyState title="Nenhum tipo de ingresso cadastrado" description="Use o formulário ao lado para criar o primeiro lote deste evento." compact className="" />
          )}
          {ticketTypes.map((ticketType) => {
            const reserved = ticketType.capacity - ticketType.availableQuantity;
            return (
              <article key={ticketType.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950">{ticketType.name}</h2>
                    <p className="mt-1 font-bold text-blue-700">{formatMoney(ticketType.priceCents)}</p>
                    {ticketType.description && <p className="mt-3 text-sm text-slate-400">{ticketType.description}</p>}
                    <p className="mt-4 text-sm text-slate-600">{ticketType.availableQuantity} disponíveis de {ticketType.capacity} · {reserved} reservados</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(ticketType)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">Editar</button>
                    <button type="button" onClick={() => void remove(ticketType)} disabled={reserved > 0 || deleteMutation.isPending} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">Excluir</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-950">{editing ? 'Editar ingresso' : 'Novo ingresso'}</h2>
          <FormField id="name" label="Nome" placeholder="Pista, VIP, Meia…" error={errors.name?.message} {...register('name')} />
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Descrição (opcional)</span>
            <textarea rows={3} {...register('description')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500" />
            {errors.description && <span className="mt-2 block text-sm text-rose-300">{errors.description.message}</span>}
          </label>
          <FormField id="priceReais" label="Preço (R$)" type="number" min="0" step="0.01" error={errors.priceReais?.message} {...register('priceReais', { valueAsNumber: true })} />
          <FormField id="capacity" label="Capacidade" type="number" min="1" step="1" error={errors.capacity?.message} {...register('capacity', { valueAsNumber: true })} />
          {submitError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{submitError}</p>}
          <div className="flex gap-2">
            {editing && <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button>}
            <button type="submit" disabled={saveMutation.isPending} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saveMutation.isPending ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
