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
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
        Sessão protegida
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-slate-950">
        Olá, {user.name}.
      </h1>
      <p className="mt-4 text-slate-500">
        Esta página só é carregada após a API validar seu JWT.
      </p>

      <dl className="mt-10 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
        <div>
          <dt className="text-sm text-slate-500">E-mail</dt>
          <dd className="mt-1 font-bold text-slate-800">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Papel</dt>
          <dd className="mt-1 font-bold text-blue-700">{roleLabels[user.role]}</dd>
        </div>
      </dl>
      {user.role === 'ORGANIZER' && (
        <Link
          to="/organizador"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
        >
          Gerenciar eventos
        </Link>
      )}
      {user.role === 'CUSTOMER' && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/minhas-reservas"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700"
          >
            Ver minhas reservas
          </Link>
          <Link
            to="/meus-ingressos"
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            Abrir meus ingressos
          </Link>
          <Link
            to="/transferencias"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700"
          >
            Ver transferências
          </Link>
        </div>
      )}
      {user.role === 'GATE' && (
        <Link
          to="/portaria"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
        >
          Abrir portaria
        </Link>
      )}
    </section>
  );
}
