import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import {
  authTokenStorage,
  getMe,
  login as loginRequest,
  register as registerRequest,
} from '../services/auth-service';
import type { LoginInput, RegisterInput, User } from '../types/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => authTokenStorage.get());
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => getMe(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const logout = useCallback(() => {
    authTokenStorage.clear();
    setToken(null);
    queryClient.removeQueries({ queryKey: ['auth'] });
  }, [queryClient]);

  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      logout();
    }
  }, [logout, meQuery.error]);

  const saveSession = useCallback(
    (accessToken: string, user: User) => {
      authTokenStorage.set(accessToken);
      setToken(accessToken);
      queryClient.setQueryData(['auth', 'me'], user);
      return user;
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      return saveSession(response.accessToken, response.user);
    },
    [saveSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      return saveSession(response.accessToken, response.user);
    },
    [saveSession],
  );

  const value = useMemo(
    () => ({
      user: token ? (meQuery.data ?? null) : null,
      token,
      isLoading: Boolean(token) && meQuery.isPending,
      login,
      register,
      logout,
    }),
    [login, logout, meQuery.data, meQuery.isPending, register, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
