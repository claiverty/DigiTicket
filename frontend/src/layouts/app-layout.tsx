import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  LogIn,
  LogOut,
  Search,
  ScanLine,
  Ticket,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

interface MenuLink {
  label: string;
  to: string;
  icon: typeof Ticket;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeWithKeyboard);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeWithKeyboard);
    };
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(search.trim() ? `/?busca=${encodeURIComponent(search.trim())}#eventos` : '/#eventos');
  };

  const closeMenu = () => setMenuOpen(false);
  const menuLinks = getMenuLinks(user?.role);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-5 sm:px-6">
          <Link className="flex shrink-0 items-center gap-2.5" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Ticket size={19} strokeWidth={2.4} />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.04em] text-slate-950">
              Digi<span className="text-blue-600">Ticket</span>
            </span>
          </Link>

          <nav className="ml-7 hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            <Link className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950" to="/#eventos">Eventos</Link>
            <Link className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950" to="/organizador">Organizar</Link>
          </nav>

          <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-md md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busque por evento, artista ou cidade"
              aria-label="Buscar eventos"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
          </form>

          <div className="relative ml-auto md:ml-2" ref={menuRef}>
            <button
              type="button"
              aria-label={`Menu da conta de ${user ? user.name.split(' ')[0] : 'visitante'}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((current) => !current)}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition sm:px-3 ${menuOpen ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-700">
                <UserRound size={18} />
              </span>
              <span className="hidden sm:block">
                <span className="block text-[11px] font-medium text-slate-400">Olá,</span>
                <span className="block max-w-28 truncate text-sm font-bold text-slate-800">{user ? user.name.split(' ')[0] : 'Visitante'}</span>
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-25px_rgba(15,23,42,0.35)]">
                <div className="bg-blue-600 px-5 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><UserRound size={21} /></span>
                    <div>
                      <p className="text-xs text-blue-100">{user ? 'Conta DigiTicket' : 'Bem-vindo ao DigiTicket'}</p>
                      <p className="mt-0.5 font-extrabold">{user?.name ?? 'Visitante'}</p>
                      {user && <p className="mt-0.5 max-w-52 truncate text-xs text-blue-100">{user.email}</p>}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {menuLinks.map(({ label, to, icon: Icon }) => (
                    <Link key={to} role="menuitem" to={to} onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                      <Icon size={18} className="text-slate-400" /> {label}
                    </Link>
                  ))}
                  <Link role="menuitem" to="/" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                    <CircleHelp size={18} className="text-slate-400" /> Explorar eventos
                  </Link>
                </div>

                <div className="border-t border-slate-100 p-3">
                  {user ? (
                    <button type="button" role="menuitem" onClick={() => { logout(); closeMenu(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">
                      <LogOut size={18} /> Sair da conta
                    </button>
                  ) : (
                    <Link role="menuitem" to="/cadastro" onClick={closeMenu} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
                      <UserPlus size={17} /> Criar conta grátis
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={submitSearch} className="relative border-t border-slate-100 px-5 py-3 md:hidden">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar eventos" aria-label="Buscar eventos" className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-blue-400 focus:bg-white" />
        </form>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link className="flex items-center gap-2.5" to="/"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Ticket size={19} /></span><span className="text-xl font-extrabold tracking-[-0.04em] text-slate-950">Digi<span className="text-blue-600">Ticket</span></span></Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">Eventos, ingressos e experiências em um fluxo simples para quem organiza e para quem participa.</p>
          </div>
          <div><p className="text-sm font-bold text-slate-950">Explore</p><div className="mt-4 flex flex-col items-start gap-3 text-sm text-slate-500"><Link className="hover:text-blue-600" to="/"><span className="inline-flex items-center gap-2"><CalendarDays size={16} /> Próximos eventos</span></Link><Link className="hover:text-blue-600" to="/meus-ingressos"><span className="inline-flex items-center gap-2"><Ticket size={16} /> Meus ingressos</span></Link></div></div>
          <div><p className="text-sm font-bold text-slate-950">Para profissionais</p><div className="mt-4 flex flex-col items-start gap-3 text-sm text-slate-500"><Link className="hover:text-blue-600" to="/organizador">Painel do organizador</Link><Link className="hover:text-blue-600" to="/portaria"><span className="inline-flex items-center gap-2"><ScanLine size={16} /> Acesso da portaria</span></Link></div></div>
        </div>
        <div className="border-t border-slate-100"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} DigiTicket.</p><p>Feito para experiências que valem a entrada.</p></div></div>
      </footer>
    </div>
  );
}

function getMenuLinks(role?: string): MenuLink[] {
  if (!role) return [{ label: 'Entrar', to: '/entrar', icon: LogIn }];
  if (role === 'ORGANIZER') return [
    { label: 'Painel do organizador', to: '/organizador', icon: CalendarDays },
    { label: 'Meu perfil', to: '/perfil', icon: UserRound },
  ];
  if (role === 'GATE') return [
    { label: 'Abrir portaria', to: '/portaria', icon: ScanLine },
    { label: 'Meu perfil', to: '/perfil', icon: UserRound },
  ];
  return [
    { label: 'Meus ingressos', to: '/meus-ingressos', icon: Ticket },
    { label: 'Minhas reservas', to: '/minhas-reservas', icon: CalendarDays },
    { label: 'Transferências', to: '/transferencias', icon: UserRound },
    { label: 'Meu perfil', to: '/perfil', icon: UserRound },
  ];
}
