import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarDays, Image, MapPin, Save, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { LoadingState } from '../components/loading-state';
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
    return <LoadingState label="Carregando formulário do evento" variant="form" className="" />;
  }

  if (isEditing && eventQuery.isError) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-rose-700">Evento não encontrado ou sem permissão de acesso.</div>;
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">
      <Link to="/organizador" className="text-sm font-bold text-blue-700">← Voltar aos eventos</Link>
      <div className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-[#071a3d] px-6 py-8 text-white sm:px-9 sm:py-10">
        <span className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[3.5rem] border-blue-500/15" />
        <div className="relative"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">{isEditing ? 'Atualizar experiência' : 'Nova experiência'}</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">{isEditing ? 'Editar evento' : 'Criar evento'}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">Preencha as informações essenciais. O evento permanece em rascunho até você decidir publicá-lo.</p></div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_-34px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Sparkles size={19} /></span><div><h2 className="font-extrabold text-slate-950">Informações principais</h2><p className="text-xs text-slate-400">Como o evento será apresentado ao público</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField id="title" label="Título" placeholder="Nome do evento" error={errors.title?.message} disabled={isSubmitting} {...register('title')} />
          </div>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-700">Descrição</span>
            <textarea rows={6} disabled={isSubmitting} {...register('description')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500 focus:bg-white" />
            {errors.description && <span className="mt-2 block text-sm text-rose-300">{errors.description.message}</span>}
          </label>
          <SelectField id="category" label="Categoria" error={errors.category?.message} disabled={isSubmitting} options={eventCategoryLabels} register={register('category')} />
          <SelectField id="saleMode" label="Modo de venda" error={errors.saleMode?.message} disabled={isSubmitting} options={eventSaleModeLabels} register={register('saleMode')} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_-34px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><MapPin size={19} /></span><div><h2 className="font-extrabold text-slate-950">Localização</h2><p className="text-xs text-slate-400">Onde o público encontrará o evento</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="venueName" label="Local" placeholder="Nome do espaço" error={errors.venueName?.message} disabled={isSubmitting} {...register('venueName')} />
          <FormField id="address" label="Endereço" placeholder="Rua e número" error={errors.address?.message} disabled={isSubmitting} {...register('address')} />
          <FormField id="city" label="Cidade" error={errors.city?.message} disabled={isSubmitting} {...register('city')} />
          <FormField id="state" label="Estado" placeholder="SP" maxLength={2} error={errors.state?.message} disabled={isSubmitting} {...register('state')} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_-34px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays size={19} /></span><div><h2 className="font-extrabold text-slate-950">Agenda e imagem</h2><p className="text-xs text-slate-400">Quando acontece e qual imagem representa a experiência</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="startDate" label="Início" type="datetime-local" error={errors.startDate?.message} disabled={isSubmitting} {...register('startDate')} />
          <FormField id="endDate" label="Término" type="datetime-local" error={errors.endDate?.message} disabled={isSubmitting} {...register('endDate')} />
          <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500"><Image size={15} className="text-blue-600" /> Imagem de divulgação</div>
            <FormField id="posterUrl" label="URL do cartaz (opcional)" type="url" placeholder="https://..." error={errors.posterUrl?.message} disabled={isSubmitting} {...register('posterUrl')} />
          </div>
          </div>
        </div>

        {submitError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{submitError}</p>}

        <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <Link to="/organizador" className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">
            {isSubmitting ? 'Salvando…' : <><Save size={17} /> Salvar rascunho</>}
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
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select id={id} disabled={disabled} {...register} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-blue-500 focus:bg-white">
        {Object.entries(options).map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
      </select>
      {error && <span className="mt-2 block text-sm text-rose-300">{error}</span>}
    </label>
  );
}
