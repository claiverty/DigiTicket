import { ConflictException } from '@nestjs/common';
import { PaymentStatus, ReservationStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentSimulatorService } from './payment-simulator.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const customerId = 'f4fcaa9c-80ca-441e-ad9c-f671a857b1da';
  const reservationId = '7965b7bd-e929-4dd7-8649-f2e4f938bc7a';
  const reservation = {
    id: reservationId,
    customerId,
    eventId: '05db15dd-74df-421d-94ea-d3b0ccf5629e',
    status: ReservationStatus.PENDING_PAYMENT,
    totalCents: 14000,
    expiresAt: new Date(Date.now() + 600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: '2f37cd9e-5cec-4d8e-81d8-1f0ea85e6571',
        reservationId,
        ticketTypeId: '953cf28b-ddc0-4bd5-9326-c94ca7fd44cc',
        quantity: 2,
        unitPriceCents: 7000,
        createdAt: new Date(),
      },
    ],
    heldSeats: [],
    event: { saleMode: 'GENERAL_ADMISSION' as const },
  };

  function createContext(statusUpdateCount = 1) {
    let createdTickets: Array<{
      customerId: string;
      reservationId: string;
      status: TicketStatus;
    }> = [];
    const transaction = {
      reservation: {
        findFirst: jest.fn().mockResolvedValue(reservation),
        updateMany: jest.fn().mockResolvedValue({ count: statusUpdateCount }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...reservation,
          status: ReservationStatus.PAID,
          payment: { status: PaymentStatus.APPROVED },
          _count: { tickets: 2 },
        }),
      },
      payment: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Record<string, unknown> }) => ({
              id: 'payment-id',
              ...data,
            }),
          ),
      },
      ticket: {
        createMany: jest.fn().mockImplementation(
          ({
            data,
          }: {
            data: Array<{
              customerId: string;
              reservationId: string;
              status: TicketStatus;
            }>;
          }) => {
            createdTickets = data;
            return Promise.resolve({ count: data.length });
          },
        ),
      },
      ticketType: { update: jest.fn() },
      eventSeat: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const reservationsService = {
      expirePendingReservations: jest.fn().mockResolvedValue(0),
    };
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      reservationsService as never,
      new PaymentSimulatorService(),
      {
        createTicketCode: jest.fn().mockReturnValue('ticket-code'),
        createManualCode: jest.fn().mockReturnValue('DT-AAAA-BBBB-CCCC'),
      } as never,
    );

    return { service, transaction, getCreatedTickets: () => createdTickets };
  }

  it('aprova, calcula o total no servidor e cria um ingresso por unidade', async () => {
    const { service, transaction, getCreatedTickets } = createContext();

    const result = await service.simulate(
      reservationId,
      customerId,
      PaymentStatus.APPROVED,
    );

    expect(transaction.payment.create).toHaveBeenCalledWith({
      data: {
        reservationId,
        status: PaymentStatus.APPROVED,
        amountCents: 14000,
      },
    });
    expect(getCreatedTickets()).toHaveLength(2);
    expect(getCreatedTickets()[0]).toEqual(
      expect.objectContaining({
        customerId,
        reservationId,
        status: TicketStatus.ACTIVE,
      }),
    );
    expect(result.ticketsCreated).toBe(2);
    expect(transaction.ticketType.update).not.toHaveBeenCalled();
  });

  it('recusa, não cria ingressos e devolve as quantidades ao estoque', async () => {
    const { service, transaction } = createContext();

    const result = await service.simulate(
      reservationId,
      customerId,
      PaymentStatus.DECLINED,
    );

    expect(result.ticketsCreated).toBe(0);
    expect(transaction.ticket.createMany).not.toHaveBeenCalled();
    expect(transaction.ticketType.update).toHaveBeenCalledWith({
      where: { id: reservation.items[0].ticketTypeId },
      data: { availableQuantity: { increment: 2 } },
    });
  });

  it('impede duas confirmações concorrentes para a mesma reserva', async () => {
    const { service, transaction } = createContext(0);

    await expect(
      service.simulate(reservationId, customerId, PaymentStatus.APPROVED),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.payment.create).not.toHaveBeenCalled();
    expect(transaction.ticket.createMany).not.toHaveBeenCalled();
  });
});
