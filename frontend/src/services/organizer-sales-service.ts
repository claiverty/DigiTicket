import type { OrganizerSalesOverview } from '../types/organizer-sales';
import { apiRequest } from './api';

export function getOrganizerSales(token: string) {
  return apiRequest<OrganizerSalesOverview>('/api/organizer/sales', { token });
}
