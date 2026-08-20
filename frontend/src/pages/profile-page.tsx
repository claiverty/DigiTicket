import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import type { Role } from '../types/auth';

const roleLabels: Record<Role, string> = {
  ORGANIZER: 'Organizador',
  CUSTOMER: 'Cliente',
  GATE: 'Portaria',
};

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
        Sessão protegida
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
        Olá, {user.name}.
      </h1>
      <p className="mt-4 text-slate-400">
        Esta página só é carregada após a API validar seu JWT.
      </p>

      <dl className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <dt className="text-sm text-slate-500">E-mail</dt>
          <dd className="mt-1 font-medium text-slate-100">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Papel</dt>
          <dd className="mt-1 font-medium text-emerald-300">{roleLabels[user.role]}</dd>
        </div>
      </dl>
      {user.role === 'ORGANIZER' && (
        <Link
          to="/organizador"
          className="mt-8 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
        >
          Gerenciar eventos
        </Link>
      )}
      {user.role === 'CUSTOMER' && (
        <Link
          to="/minhas-reservas"
          className="mt-8 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
        >
          Ver minhas reservas
        </Link>
      )}
    </section>
  );
}
