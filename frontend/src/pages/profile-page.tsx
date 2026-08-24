import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import type { Role } from '../types/auth';

const roleLabels: Record<Role, string> = {
  ORGANIZER: 'Organizador',
  CUSTOMER: 'Cliente',
  GATE: 'Portaria',
};

const profileContent: Record<Role, { eyebrow: string; description: string }> = {
  ORGANIZER: {
    eyebrow: 'Perfil do organizador',
    description: 'Confira seus dados e acesse a gestão dos seus eventos.',
  },
  CUSTOMER: {
    eyebrow: 'Minha conta',
    description: 'Confira seus dados e acesse seus ingressos, reservas e transferências.',
  },
  GATE: {
    eyebrow: 'Perfil da portaria',
    description: 'Confira seus dados e acesse a validação de ingressos dos eventos.',
  },
};

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const content = profileContent[user.role];

  return (
    <section className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-16 lg:py-24">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">
        {content.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">
        Olá, {user.name}.
      </h1>
      <p className="mt-4 text-slate-500">
        {content.description}
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
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            to="/minhas-reservas"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700"
          >
            Ver minhas reservas
          </Link>
          <Link
            to="/meus-ingressos"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white hover:bg-blue-700"
          >
            Abrir meus ingressos
          </Link>
          <Link
            to="/transferencias"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700"
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
