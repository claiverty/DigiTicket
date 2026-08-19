import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
    <section className="mx-auto max-w-xl px-6 py-16 lg:py-24">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Nova conta
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Crie seu acesso.
        </h1>
        <p className="mt-4 text-slate-400">
          Cadastros públicos são criados com o perfil de cliente.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
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
          <p role="alert" className="mt-5 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{' '}
          <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/entrar">
            Entrar
          </Link>
        </p>
      </form>
    </section>
  );
}
