import type { Event, EventCategory } from './event';

export interface ExternalEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  venueName: string;
  address: string;
  city: string;
  state: string;
  alreadyImported: boolean;
  importable: boolean;
}

export interface ExternalEventSearchResult {
  events: ExternalEvent[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface ExternalEventFilters {
  keyword: string;
  city?: string;
  page?: number;
}

export type ImportedExternalEvent = Event;
