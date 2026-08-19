import type { ApiHealth } from '../types/health';
import { apiRequest } from './api';

export const getApiHealth = () => apiRequest<ApiHealth>('/api/health');
