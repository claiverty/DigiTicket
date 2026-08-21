export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED';

export interface PendingTicketTransfer {
  id: string;
  status: 'PENDING';
  createdAt: string;
  recipient: { name: string; email: string };
}

export interface TicketDisplay {
  manualCode: string;
  status: TicketStatus;
  usedAt: string | null;
  qrToken: string;
  event: {
    id: string;
    slug: string;
    title: string;
    posterUrl: string | null;
    venueName: string;
    address: string;
    city: string;
    state: string;
    startDate: string;
    endDate: string;
  };
  ticketType: { id: string; name: string };
  customer: { name: string };
  pendingTransfer?: PendingTicketTransfer | null;
}

export interface Ticket extends TicketDisplay {
  id: string;
  eventId: string;
  customerId: string;
  reservationId: string;
  reservationItemId: string;
  ticketTypeId: string;
  ticketCode: string;
  shareToken: string | null;
  sharedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pendingTransfer: PendingTicketTransfer | null;
}
