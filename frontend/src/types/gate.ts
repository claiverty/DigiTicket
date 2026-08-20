export type TicketValidationResult =
  | 'VALID'
  | 'INVALID'
  | 'WRONG_EVENT'
  | 'ALREADY_USED';

export type TicketValidationMethod = 'QR' | 'MANUAL';

export interface GateEvent {
  id: string;
  title: string;
  venueName: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  _count: { tickets: number };
}

export interface ValidatedTicket {
  id: string;
  manualCode: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  usedAt: string | null;
  customer: { name: string };
  ticketType: { name: string };
  event: { id: string; title: string };
}

export interface GateValidationResponse {
  result: TicketValidationResult;
  message: string;
  validatedAt: string;
  ticket: ValidatedTicket | null;
}

export interface GateValidationLog {
  id: string;
  result: TicketValidationResult;
  method: TicketValidationMethod;
  createdAt: string;
  ticket: {
    manualCode: string;
    customer: { name: string };
    ticketType: { name: string };
  } | null;
  gateUser: { name: string };
}
