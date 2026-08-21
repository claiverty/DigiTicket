import { apiRequest } from './api';
import type { Reservation } from '../types/reservation';
import type { EventSeat, SeatSectionInput } from '../types/seat';

export function getPublicSeats(eventId: string) {
  return apiRequest<EventSeat[]>(`/api/events/${eventId}/seats`);
}

export function getOrganizerSeats(eventId: string, token: string) {
  return apiRequest<EventSeat[]>(`/api/organizer/events/${eventId}/seat-sections`, { token });
}

export function createSeatSection(eventId: string, input: SeatSectionInput, token: string) {
  return apiRequest(`/api/organizer/events/${eventId}/seat-sections`, {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

export async function deleteSeatSection(eventId: string, ticketTypeId: string, token: string) {
  await apiRequest(`/api/organizer/events/${eventId}/seat-sections/${ticketTypeId}`, {
    method: 'DELETE',
    token,
  });
}

export function updateSeatSectionSize(
  eventId: string,
  ticketTypeId: string,
  seatDisplaySize: 'STANDARD' | 'LARGE',
  token: string,
) {
  return apiRequest(`/api/organizer/events/${eventId}/seat-sections/${ticketTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ seatDisplaySize }),
    token,
  });
}

export function createSeatReservation(eventId: string, seatIds: string[], token: string) {
  return apiRequest<Reservation>(`/api/reservations/events/${eventId}/seats`, {
    method: 'POST',
    body: JSON.stringify({ seatIds }),
    token,
  });
}
