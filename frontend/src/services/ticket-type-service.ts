import { apiRequest } from './api';
import type { TicketType, TicketTypeInput } from '../types/event';

export function getTicketTypes(eventId: string, token: string) {
  return apiRequest<TicketType[]>(
    `/api/organizer/events/${eventId}/ticket-types`,
    { token },
  );
}

export function createTicketType(
  eventId: string,
  input: TicketTypeInput,
  token: string,
) {
  return apiRequest<TicketType>(
    `/api/organizer/events/${eventId}/ticket-types`,
    { method: 'POST', body: JSON.stringify(input), token },
  );
}

export function updateTicketType(
  eventId: string,
  id: string,
  input: TicketTypeInput,
  token: string,
) {
  return apiRequest<TicketType>(
    `/api/organizer/events/${eventId}/ticket-types/${id}`,
    { method: 'PATCH', body: JSON.stringify(input), token },
  );
}

export async function deleteTicketType(
  eventId: string,
  id: string,
  token: string,
): Promise<void> {
  await apiRequest(
    `/api/organizer/events/${eventId}/ticket-types/${id}`,
    { method: 'DELETE', token },
  );
}
