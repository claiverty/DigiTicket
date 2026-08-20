import { apiRequest } from './api';
import type {
  CreateReservationInput,
  Reservation,
} from '../types/reservation';

export function createReservation(
  eventId: string,
  input: CreateReservationInput,
  token: string,
) {
  return apiRequest<Reservation>(`/api/reservations/events/${eventId}`, {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

export function getMyReservations(token: string) {
  return apiRequest<Reservation[]>('/api/reservations', { token });
}

export function getReservation(id: string, token: string) {
  return apiRequest<Reservation>(`/api/reservations/${id}`, { token });
}

export function cancelReservation(id: string, token: string) {
  return apiRequest<Reservation>(`/api/reservations/${id}/cancel`, {
    method: 'POST',
    token,
  });
}
