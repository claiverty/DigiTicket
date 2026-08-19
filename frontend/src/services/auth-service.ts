import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '../types/auth';
import { apiRequest } from './api';

const TOKEN_KEY = 'digiticket.accessToken';

export const authTokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const login = (input: LoginInput) =>
  apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const register = (input: RegisterInput) =>
  apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getMe = (token: string) =>
  apiRequest<User>('/api/auth/me', { token });
