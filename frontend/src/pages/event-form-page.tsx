import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { useAuth } from '../hooks/use-auth';
import { eventSchema, type EventFormData } from '../schemas/event-schema';
import { ApiError } from '../services/api';
import {
  createEvent,
  getOrganizerEvent,
  updateEvent,
} from '../services/event-service';
import type { EventInput } from '../types/event';
import {
  eventCategoryLabels,
  eventSaleModeLabels,
  toDateTimeLocal,
} from '../utils/event-formatters';

const emptyForm: EventFormData = {
  title: '',
  description: '',
  category: 'SHOW',
  saleMode: 'GENERAL_ADMISSION',
  venueName: '',
  address: '',
  city: '',
  state: '',
  startDate: '',
  endDate: '',
  posterUrl: '',
};

export function EventFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const eventQuery = useQuery({
    queryKey: ['events', 'organizer', id],
    queryFn: () => getOrganizerEvent(id!, token!),
    enabled: isEditing && Boolean(token),
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    if (!eventQuery.data) return;

    reset({
      title: eventQuery.data.title,
      description: eventQuery.data.description,
      category: eventQuery.data.category,
      saleMode: eventQuery.data.saleMode,
      venueName: eventQuery.data.venueName,
      address: eventQuery.data.address,
      city: eventQuery.data.city,
      state: eventQuery.data.state,
      startDate: toDateTimeLocal(eventQuery.data.startDate),
      endDate: toDateTimeLocal(eventQuery.data.endDate),
      posterUrl: eventQuery.data.posterUrl ?? '',
    });
  }, [eventQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (input: EventInput) =>
      isEditing
        ? updateEvent(id!, input, token!)
        : createEvent(input, token!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/organizador', { replace: true });
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    try {
      await saveMutation.mutateAsync({
        ...data,
        state: data.state.toUpperCase(),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        posterUrl: data.posterUrl || undefined,
      });
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar o evento.',
      );
    }
  });

  if (isEditing && eventQuery.isPending) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-slate-400">Carregando evento…</div>;
  }

  if (isEditing && eventQuery.isError) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-rose-200">Evento não encontrado ou sem permissão de acesso.</div>;
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <Link to="/organizador" className="text-sm font-semibold text-emerald-300">← Voltar aos eventos</Link>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
        {isEditing ? 'Editar evento' : 'Criar evento'}
      </h1>
      <p className="mt-3 text-slate-400">O evento será salvo como rascunho até você decidir publicá-lo.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField id="title" label="Título" placeholder="Nome do evento" error={errors.title?.message} disabled={isSubmitting} {...register('title')} />
          </div>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">Descrição</span>
            <textarea rows={6} disabled={isSubmitting} {...register('description')} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            {errors.description && <span className="mt-2 block text-sm text-rose-300">{errors.description.message}</span>}
          </label>
          <SelectField id="category" label="Categoria" error={errors.category?.message} disabled={isSubmitting} options={eventCategoryLabels} register={register('category')} />
          <SelectField id="saleMode" label="Modo de venda" error={errors.saleMode?.message} disabled={isSubmitting} options={eventSaleModeLabels} register={register('saleMode')} />
          <FormField id="venueName" label="Local" placeholder="Nome do espaço" error={errors.venueName?.message} disabled={isSubmitting} {...register('venueName')} />
          <FormField id="address" label="Endereço" placeholder="Rua e número" error={errors.address?.message} disabled={isSubmitting} {...register('address')} />
          <FormField id="city" label="Cidade" error={errors.city?.message} disabled={isSubmitting} {...register('city')} />
          <FormField id="state" label="Estado" placeholder="SP" maxLength={2} error={errors.state?.message} disabled={isSubmitting} {...register('state')} />
          <FormField id="startDate" label="Início" type="datetime-local" error={errors.startDate?.message} disabled={isSubmitting} {...register('startDate')} />
          <FormField id="endDate" label="Término" type="datetime-local" error={errors.endDate?.message} disabled={isSubmitting} {...register('endDate')} />
          <div className="sm:col-span-2">
            <FormField id="posterUrl" label="URL do cartaz (opcional)" type="url" placeholder="https://..." error={errors.posterUrl?.message} disabled={isSubmitting} {...register('posterUrl')} />
          </div>
        </div>

        {submitError && <p role="alert" className="rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{submitError}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <Link to="/organizador" className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-200">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
            {isSubmitting ? 'Salvando…' : 'Salvar rascunho'}
          </button>
        </div>
      </form>
    </section>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  error?: string;
  disabled: boolean;
  options: Record<string, string>;
  register: React.SelectHTMLAttributes<HTMLSelectElement>;
}

function SelectField({ id, label, error, disabled, options, register }: SelectFieldProps) {
  return (
    <label htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <select id={id} disabled={disabled} {...register} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
        {Object.entries(options).map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
      </select>
      {error && <span className="mt-2 block text-sm text-rose-300">{error}</span>}
    </label>
  );
}
