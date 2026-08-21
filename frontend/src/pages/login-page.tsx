import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ArrowRight, ShieldCheck, TicketCheck } from 'lucide-react';
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
    <section className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col justify-between bg-blue-600 p-8 text-white sm:p-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Área do usuário</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-0.045em]">Bom ter você de volta.</h1>
            <p className="mt-4 leading-7 text-blue-100">Acesse seus ingressos, reservas e todas as experiências da sua conta.</p>
          </div>
          <div className="mt-12 space-y-4 border-t border-white/20 pt-6 text-sm text-blue-50">
            <p className="flex items-center gap-3"><TicketCheck size={19} /> Ingressos digitais em um só lugar</p>
            <p className="flex items-center gap-3"><ShieldCheck size={19} /> Acesso protegido à sua conta</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Entrar</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">Acesse sua conta DigiTicket</h2>
          <div className="mt-8 space-y-5">
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

          {submitError && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{submitError}</p>}

          <button type="submit" disabled={isSubmitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Entrando…' : <>Entrar <ArrowRight size={17} /></>}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">Ainda não possui conta?{' '}<Link className="font-bold text-blue-700 hover:text-blue-800" to="/cadastro">Criar conta</Link></p>
        </form>
      </div>
    </section>
  );
}
