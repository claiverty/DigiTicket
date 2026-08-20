import type {
  EventCategory,
  EventSaleMode,
  EventStatus,
} from '../types/event';

export const eventCategoryLabels: Record<EventCategory, string> = {
  SHOW: 'Show',
  MOVIE: 'Cinema',
  THEATER: 'Teatro',
  OTHER: 'Outro',
};

export const eventStatusLabels: Record<EventStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
};

export const eventSaleModeLabels: Record<EventSaleMode, string> = {
  GENERAL_ADMISSION: 'Entrada por quantidade',
  RESERVED_SEATING: 'Assentos reservados',
};

export function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatMoney(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);
}

export function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
