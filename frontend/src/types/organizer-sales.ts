import type { PaymentStatus, ReservationStatus } from './reservation';
import type { EventStatus } from './event';

export interface OrganizerEventSales {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  posterUrl: string | null;
  venueName: string;
  city: string;
  state: string;
  startDate: string;
  reservationCount: number;
  paidReservationCount: number;
  ticketsSold: number;
  simulatedRevenueCents: number;
}

export interface OrganizerSalesOverview {
  summary: {
    reservationCount: number;
    paidReservationCount: number;
    ticketsSold: number;
    simulatedRevenueCents: number;
  };
  eventResults: OrganizerEventSales[];
  upcomingEvents: OrganizerEventSales[];
  recentReservations: Array<{
    id: string;
    status: ReservationStatus;
    totalCents: number;
    createdAt: string;
    customer: { name: string; email: string };
    event: { id: string; title: string };
    quantity: number;
    ticketsCreated: number;
    paymentStatus: PaymentStatus | null;
  }>;
}
