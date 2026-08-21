export type TicketTransferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CANCELLED'
  | 'DECLINED';

export interface TicketTransfer {
  id: string;
  ticketId: string;
  senderId: string;
  recipientId: string;
  status: TicketTransferStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: { id: string; name: string; email: string };
  recipient: { id: string; name: string; email: string };
  ticket: {
    id: string;
    manualCode: string;
    status: 'ACTIVE' | 'USED' | 'CANCELLED';
    customer: { id: string; name: string };
    event: {
      id: string;
      title: string;
      posterUrl: string | null;
      venueName: string;
      city: string;
      state: string;
      startDate: string;
    };
    ticketType: { id: string; name: string };
  };
}
