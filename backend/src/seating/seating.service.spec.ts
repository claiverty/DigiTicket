import { ConflictException } from '@nestjs/common';
import { EventSaleMode, EventStatus, SeatStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SeatingService } from './seating.service';

describe('SeatingService', () => {
  const eventId = '4863d735-a2c5-45ea-a759-a9d9d963ab91';
  const customerId = '14f5f2ca-a7a9-46a1-af8c-48ad07261e34';
  const ticketTypeId = 'd49636a3-0d41-426c-a29a-6ae1a4f7deef';
  const seat = {
    id: '632c3cc5-f979-49a8-9305-8b0e53262a73',
    eventId,
    ticketTypeId,
    reservationId: null,
    rowLabel: 'A',
    seatNumber: 1,
    status: SeatStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ticketType: { id: ticketTypeId, priceCents: 5000 },
  };

  function createContext(claimCount: number) {
    const transaction = {
      event: {
        findFirst: jest.fn().mockResolvedValue({
          id: eventId,
          status: EventStatus.PUBLISHED,
          saleMode: EventSaleMode.RESERVED_SEATING,
        }),
      },
      eventSeat: {
        findMany: jest.fn().mockResolvedValue([seat]),
        updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
      },
      reservation: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: { totalCents: number } }) => {
            expect(data.totalCents).toBe(5000);
            return Promise.resolve({ id: 'reservation-id' });
          }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'reservation-id' }),
      },
      ticketType: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = new SeatingService(
      prisma as unknown as PrismaService,
      { expirePendingReservations: jest.fn().mockResolvedValue(0) } as never,
    );
    return { service, transaction };
  }

  it('bloqueia o assento e calcula o preço no servidor', async () => {
    const { service, transaction } = createContext(1);

    await service.createReservation(customerId, eventId, {
      seatIds: [seat.id],
    });

    expect(transaction.eventSeat.updateMany).toHaveBeenCalledWith({
      where: { id: seat.id, eventId, status: SeatStatus.AVAILABLE },
      data: { status: SeatStatus.HELD, reservationId: 'reservation-id' },
    });
    expect(transaction.reservation.create).toHaveBeenCalledTimes(1);
  });

  it('rejeita a disputa quando o assento já foi bloqueado', async () => {
    const { service, transaction } = createContext(0);

    await expect(
      service.createReservation(customerId, eventId, { seatIds: [seat.id] }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.ticketType.updateMany).not.toHaveBeenCalled();
  });
});
