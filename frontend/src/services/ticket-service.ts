import { apiRequest } from './api';
import type { Ticket, TicketDisplay } from '../types/ticket';

export function getMyTickets(token: string) {
  return apiRequest<Ticket[]>('/api/tickets', { token });
}

export function getTicket(id: string, token: string) {
  return apiRequest<Ticket>(`/api/tickets/${id}`, { token });
}

export function getSharedTicket(shareToken: string) {
  return apiRequest<TicketDisplay>(`/api/tickets/shared/${shareToken}`);
}

export function createTicketShare(id: string, token: string) {
  return apiRequest<Ticket>(`/api/tickets/${id}/share`, {
    method: 'POST',
    token,
  });
}

export async function revokeTicketShare(
  id: string,
  token: string,
): Promise<void> {
  await apiRequest(`/api/tickets/${id}/share`, {
    method: 'DELETE',
    token,
  });
}
