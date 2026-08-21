import { apiRequest } from './api';
import type {
  ExternalEventFilters,
  ExternalEventSearchResult,
  ImportedExternalEvent,
} from '../types/external-event';

export function searchExternalEvents(
  filters: ExternalEventFilters,
  token: string,
) {
  const params = new URLSearchParams({
    keyword: filters.keyword.trim(),
    page: String(filters.page ?? 0),
  });

  if (filters.city?.trim()) {
    params.set('city', filters.city.trim());
  }

  return apiRequest<ExternalEventSearchResult>(
    `/api/integrations/ticketmaster/events?${params.toString()}`,
    { token },
  );
}

export function importExternalEvent(externalId: string, token: string) {
  return apiRequest<ImportedExternalEvent>(
    `/api/integrations/ticketmaster/events/${encodeURIComponent(externalId)}/import`,
    { method: 'POST', token },
  );
}
