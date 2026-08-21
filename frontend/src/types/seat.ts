export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD';

export interface EventSeat {
  id: string;
  eventId: string;
  ticketTypeId: string;
  rowLabel: string;
  seatNumber: number;
  status: SeatStatus;
  ticketType: {
    id: string;
    name: string;
    priceCents: number;
    seatDisplaySize: 'STANDARD' | 'LARGE';
  };
}

export interface SeatSectionInput {
  name: string;
  priceCents: number;
  rows: number;
  seatsPerRow: number;
  seatDisplaySize: 'STANDARD' | 'LARGE';
}
