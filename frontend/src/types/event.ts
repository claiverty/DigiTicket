export type EventCategory = 'SHOW' | 'MOVIE' | 'THEATER' | 'OTHER';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type EventSaleMode = 'GENERAL_ADMISSION' | 'RESERVED_SEATING';

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  saleMode: EventSaleMode;
  venueName: string;
  address: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  status: EventStatus;
  externalSource: string | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  organizer?: { name: string };
}

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  saleMode: EventSaleMode;
  venueName: string;
  address: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  posterUrl?: string;
}

export interface EventFilters {
  search?: string;
  category?: EventCategory | '';
  city?: string;
  date?: string;
}
