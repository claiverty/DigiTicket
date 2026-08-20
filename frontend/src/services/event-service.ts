import { apiRequest } from './api';
import type { Event, EventFilters, EventInput } from '../types/event';

function createQueryString(filters: EventFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getPublishedEvents(filters: EventFilters = {}) {
  return apiRequest<Event[]>(`/api/events${createQueryString(filters)}`);
}

export function getPublishedEvent(slug: string) {
  return apiRequest<Event>(`/api/events/${slug}`);
}

export function getOrganizerEvents(token: string) {
  return apiRequest<Event[]>('/api/organizer/events', { token });
}

export function getOrganizerEvent(id: string, token: string) {
  return apiRequest<Event>(`/api/organizer/events/${id}`, { token });
}

export function createEvent(input: EventInput, token: string) {
  return apiRequest<Event>('/api/organizer/events', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

export function updateEvent(id: string, input: EventInput, token: string) {
  return apiRequest<Event>(`/api/organizer/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    token,
  });
}

export function publishEvent(id: string, token: string) {
  return apiRequest<Event>(`/api/organizer/events/${id}/publish`, {
    method: 'POST',
    token,
  });
}

export function cancelEvent(id: string, token: string) {
  return apiRequest<Event>(`/api/organizer/events/${id}/cancel`, {
    method: 'POST',
    token,
  });
}

export async function deleteEvent(id: string, token: string): Promise<void> {
  await apiRequest<unknown>(`/api/organizer/events/${id}`, {
    method: 'DELETE',
    token,
  });
}
