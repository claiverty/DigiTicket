import type { TicketType } from './event';

export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ReservationItem {
  id: string;
  reservationId: string;
  ticketTypeId: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
  ticketType: Pick<TicketType, 'id' | 'name'>;
}

export interface Reservation {
  id: string;
  customerId: string;
  eventId: string;
  status: ReservationStatus;
  totalCents: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    slug: string;
    title: string;
    posterUrl: string | null;
    venueName: string;
    city: string;
    state: string;
    startDate: string;
  };
  items: ReservationItem[];
  payment: Payment | null;
  _count: { tickets: number };
}

export type PaymentStatus = 'APPROVED' | 'DECLINED';

export interface Payment {
  id: string;
  reservationId: string;
  status: PaymentStatus;
  amountCents: number;
  processedAt: string;
  createdAt: string;
}

export interface PaymentResult {
  payment: Payment;
  reservation: Reservation;
  ticketsCreated: number;
}

export interface CreateReservationInput {
  items: Array<{ ticketTypeId: string; quantity: number }>;
}
