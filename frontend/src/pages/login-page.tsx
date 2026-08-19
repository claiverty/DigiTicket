import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '../components/form-field';
import { useAuth } from '../hooks/use-auth';
import { loginSchema, type LoginFormData } from '../schemas/auth-schemas';
import { ApiError } from '../services/api';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  if (user) {
    return <Navigate to="/perfil" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from ?? '/perfil';

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível entrar. Tente novamente.',
      );
    }
  });

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
      <div className="self-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Acesse sua conta
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Seus eventos começam aqui.
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-slate-400">
          Entre para acompanhar suas próximas experiências e acessar as áreas disponíveis para seu perfil.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
      >
        <div className="space-y-5">
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
            autoComplete="current-password"
            placeholder="Sua senha"
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
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          Ainda não possui conta?{' '}
          <Link className="font-semibold text-emerald-300 hover:text-emerald-200" to="/cadastro">
            Criar conta
          </Link>
        </p>
      </form>
    </section>
  );
}
