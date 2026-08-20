import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link className="text-lg font-semibold tracking-tight" to="/">
            digi<span className="text-emerald-400">ticket</span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Navegação principal">
            <Link className="text-sm text-slate-300 hover:text-white" to="/">
              Eventos
            </Link>
            {user ? (
              <>
                {user.role === 'ORGANIZER' && (
                  <Link className="text-sm text-slate-300 hover:text-white" to="/organizador">
                    Organizador
                  </Link>
                )}
                {user.role === 'CUSTOMER' && (
                  <Link className="text-sm text-slate-300 hover:text-white" to="/minhas-reservas">
                    Minhas reservas
                  </Link>
                )}
                <Link className="text-sm text-slate-300 hover:text-white" to="/perfil">
                  {user.name.split(' ')[0]}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link className="text-sm text-slate-300 hover:text-white" to="/entrar">
                  Entrar
                </Link>
                <Link
                  className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  to="/cadastro"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
