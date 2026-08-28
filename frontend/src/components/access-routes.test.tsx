import { render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../hooks/use-auth';
import type { Role, User } from '../types/auth';
import { ProtectedRoute } from './protected-route';
import { RoleRoute } from './role-route';

function createUser(role: Role): User {
  return {
    id: 'user-1',
    name: 'Usuário Teste',
    email: 'usuario@teste.com',
    role,
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
  };
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

function LoginDestination() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;

  return <p>Página de login: {state?.from ?? 'sem origem'}</p>;
}

function renderProtectedRoute(authValue: AuthContextValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/minhas-reservas']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/minhas-reservas" element={<p>Área protegida</p>} />
          </Route>
          <Route path="/entrar" element={<LoginDestination />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('exibe o estado de carregamento enquanto a sessão é validada', () => {
    renderProtectedRoute(createAuthValue({ isLoading: true }));

    expect(screen.getByText('Verificando sua sessão…')).toBeInTheDocument();
  });

  it('redireciona visitantes para o login preservando a página de origem', () => {
    renderProtectedRoute(createAuthValue());

    expect(
      screen.getByText('Página de login: /minhas-reservas'),
    ).toBeInTheDocument();
  });

  it('libera a rota quando existe uma sessão autenticada', () => {
    renderProtectedRoute(
      createAuthValue({
        user: createUser('CUSTOMER'),
        token: 'token-teste',
      }),
    );

    expect(screen.getByText('Área protegida')).toBeInTheDocument();
  });
});

describe('RoleRoute', () => {
  function renderRoleRoute(userRole: Role, allowedRoles: Role[]) {
    return render(
      <AuthContext.Provider
        value={createAuthValue({
          user: createUser(userRole),
          token: 'token-teste',
        })}
      >
        <MemoryRouter initialEntries={['/organizador']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                element={<RoleRoute allowedRoles={allowedRoles} />}
              >
                <Route
                  path="/organizador"
                  element={<p>Painel autorizado</p>}
                />
              </Route>
            </Route>
            <Route path="/perfil" element={<p>Meu perfil</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  }

  it('libera o painel para uma função autorizada', () => {
    renderRoleRoute('ORGANIZER', ['ORGANIZER']);

    expect(screen.getByText('Painel autorizado')).toBeInTheDocument();
  });

  it('envia uma função sem permissão para o perfil', () => {
    renderRoleRoute('CUSTOMER', ['ORGANIZER']);

    expect(screen.getByText('Meu perfil')).toBeInTheDocument();
  });
});
