import type { EventCategory } from '@prisma/client';

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
}

export interface ExternalEventSearchResult {
  events: ExternalEvent[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface TicketmasterApiEvent {
  id?: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  additionalInfo?: string;
  url?: string;
  images?: Array<{
    url?: string;
    ratio?: string;
    width?: number;
    fallback?: boolean;
  }>;
  dates?: {
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };
  classifications?: Array<{
    primary?: boolean;
    segment?: { name?: string };
  }>;
  _embedded?: {
    attractions?: Array<{ name?: string }>;
    venues?: Array<{
      name?: string;
      address?: { line1?: string; line2?: string };
      city?: { name?: string };
      state?: { stateCode?: string; name?: string };
    }>;
  };
}

export interface TicketmasterSearchResponse {
  _embedded?: { events?: TicketmasterApiEvent[] };
  page?: {
    number?: number;
    totalPages?: number;
    totalElements?: number;
  };
}
