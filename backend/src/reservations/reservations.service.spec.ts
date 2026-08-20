import { ConflictException } from '@nestjs/common';
import { EventSaleMode, EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const customerId = '96749eb9-a962-4275-9174-6c92f98e6868';
  const eventId = 'a7d15e14-fdd3-44b9-89ce-b66d20700134';
  const ticketTypeId = 'b426d25a-42cf-4227-b46e-17878a64c078';
  const futureDate = new Date(Date.now() + 86_400_000);
  const ticketType = {
    id: ticketTypeId,
    eventId,
    name: 'Pista',
    description: null,
    priceCents: 7000,
    capacity: 100,
    availableQuantity: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createContext(stockUpdateCount = 1) {
    const transaction = {
      event: {
        findFirst: jest.fn().mockResolvedValue({
          id: eventId,
          startDate: futureDate,
          status: EventStatus.PUBLISHED,
          saleMode: EventSaleMode.GENERAL_ADMISSION,
        }),
      },
      ticketType: {
        findMany: jest.fn().mockResolvedValue([ticketType]),
        updateMany: jest.fn().mockResolvedValue({ count: stockUpdateCount }),
        update: jest.fn(),
      },
      reservation: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Record<string, unknown> }) => ({
              id: 'reservation-id',
              ...data,
            }),
          ),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      reservationItem: { findMany: jest.fn() },
    };
    const prisma = {
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    return {
      transaction,
      prisma,
      service: new ReservationsService(prisma as unknown as PrismaService),
    };
  }

  it('bloqueia o estoque e calcula o total exclusivamente no servidor', async () => {
    const { service, transaction } = createContext();

    const reservation = await service.create(customerId, eventId, {
      items: [{ ticketTypeId, quantity: 2 }],
    });

    expect(transaction.ticketType.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticketTypeId,
        eventId,
        availableQuantity: { gte: 2 },
      },
      data: { availableQuantity: { decrement: 2 } },
    });
    expect(reservation).toEqual(
      expect.objectContaining({ customerId, eventId, totalCents: 14000 }),
    );
  });

  it('rejeita a reserva quando a atualização condicional não encontra estoque', async () => {
    const { service, transaction } = createContext(0);

    await expect(
      service.create(customerId, eventId, {
        items: [{ ticketTypeId, quantity: 11 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.reservation.create).not.toHaveBeenCalled();
  });

  it('permite somente uma vencedora quando duas reservas disputam o último ingresso', async () => {
    const { service, transaction } = createContext();
    let remainingQuantity = 1;
    transaction.ticketType.updateMany.mockImplementation(
      ({ where }: { where: { availableQuantity: { gte: number } } }) => {
        const quantity = where.availableQuantity.gte;
        if (remainingQuantity < quantity) return Promise.resolve({ count: 0 });
        remainingQuantity -= quantity;
        return Promise.resolve({ count: 1 });
      },
    );

    const results = await Promise.allSettled([
      service.create(customerId, eventId, {
        items: [{ ticketTypeId, quantity: 1 }],
      }),
      service.create('second-customer-id', eventId, {
        items: [{ ticketTypeId, quantity: 1 }],
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(transaction.reservation.create).toHaveBeenCalledTimes(1);
  });

  it('marca reserva vencida e devolve sua quantidade ao estoque', async () => {
    const { service, prisma, transaction } = createContext();
    prisma.reservation.findMany.mockResolvedValue([{ id: 'expired-id' }]);
    transaction.reservation.updateMany.mockResolvedValue({ count: 1 });
    transaction.reservationItem.findMany.mockResolvedValue([
      { ticketTypeId, quantity: 3 },
    ]);

    await expect(service.expirePendingReservations()).resolves.toBe(1);
    expect(transaction.ticketType.update).toHaveBeenCalledWith({
      where: { id: ticketTypeId },
      data: { availableQuantity: { increment: 3 } },
    });
  });
});
