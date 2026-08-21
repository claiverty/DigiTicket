import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ArrowRight, ShieldCheck, TicketCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { useAuth } from '../hooks/use-auth';
import {
  registerSchema,
  type RegisterFormData,
} from '../schemas/auth-schemas';
import { ApiError } from '../services/api';

export function RegisterPage() {
  const { register: createAccount, user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  if (user) {
    return <Navigate to="/perfil" replace />;
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    try {
      await createAccount(data);
      navigate('/perfil', { replace: true });
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível criar a conta. Tente novamente.',
      );
    }
  });

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:py-20">
      <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.5)] lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative hidden overflow-hidden bg-[#071a3d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <span className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full border-[3.5rem] border-blue-500/15" />
          <div className="relative"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Sua experiência começa aqui</p><h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-[-0.045em]">Um ingresso.<br />Muitas histórias.</h1><p className="mt-5 text-sm leading-7 text-blue-100/70">Crie sua conta para reservar, guardar e transferir seus ingressos com facilidade.</p></div>
          <div className="relative space-y-4 border-t border-white/10 pt-6 text-sm text-blue-100/80"><p className="flex items-center gap-3"><TicketCheck size={18} className="text-blue-400" /> Carteira digital organizada</p><p className="flex items-center gap-3"><ShieldCheck size={18} className="text-blue-400" /> Acesso seguro à sua conta</p></div>
        </div>

      <form onSubmit={onSubmit} className="p-6 sm:p-9 lg:p-12">
        <div className="mb-8"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Nova conta</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950">Crie seu acesso.</h2><p className="mt-3 text-sm text-slate-500">O cadastro público cria uma conta de cliente.</p></div>
        <div className="space-y-5">
          <FormField
            id="name"
            label="Nome"
            autoComplete="name"
            placeholder="Seu nome"
            error={errors.name?.message}
            disabled={isSubmitting}
            {...register('name')}
          />
          <FormField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />
          <FormField
            id="password"
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            error={errors.password?.message}
            disabled={isSubmitting}
            {...register('password')}
          />
        </div>

        {submitError && (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Criando conta…' : <>Criar conta <ArrowRight size={16} /></>}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já possui uma conta?{' '}
          <Link className="font-bold text-blue-700 hover:text-blue-800" to="/entrar">
            Entrar
          </Link>
        </p>
      </form>
      </div>
    </section>
  );
}
