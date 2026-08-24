import { EventStatus, PaymentStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizerSalesService } from './organizer-sales.service';

describe('OrganizerSalesService', () => {
  const organizerId = 'd2f65ead-1d11-47fc-a8c9-bcd24f3b99cd';
  const now = new Date('2026-12-12T22:00:00.000Z');
  const prismaMock = {
    reservation: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: { count: jest.fn() },
    payment: { aggregate: jest.fn() },
    event: { findMany: jest.fn() },
  };
  const reservationsServiceMock = {
    expirePendingReservations: jest.fn(),
  };
  let service: OrganizerSalesService;

  beforeEach(() => {
    jest.clearAllMocks();
    reservationsServiceMock.expirePendingReservations.mockResolvedValue(0);
    prismaMock.reservation.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    prismaMock.ticket.count.mockResolvedValue(3);
    prismaMock.payment.aggregate.mockResolvedValue({
      _sum: { amountCents: 15000 },
    });
    prismaMock.event.findMany.mockResolvedValue([
      {
        id: 'evento-1',
        title: 'Festival Demo',
        slug: 'festival-demo',
        status: EventStatus.PUBLISHED,
        posterUrl: null,
        venueName: 'Arena Demo',
        city: 'Brasília',
        state: 'DF',
        startDate: now,
        _count: { reservations: 3, tickets: 2 },
        reservations: [
          {
            payment: {
              status: PaymentStatus.APPROVED,
              amountCents: 10000,
            },
          },
          { payment: null },
        ],
      },
    ]);
    prismaMock.reservation.findMany.mockResolvedValue([
      {
        id: 'reserva-1',
        status: ReservationStatus.PAID,
        totalCents: 10000,
        createdAt: now,
        customer: { name: 'Cliente Demo', email: 'cliente@demo.com' },
        event: { id: 'evento-1', title: 'Festival Demo' },
        items: [{ quantity: 2 }],
        payment: { status: PaymentStatus.APPROVED },
        _count: { tickets: 2 },
      },
    ]);
    service = new OrganizerSalesService(
      prismaMock as unknown as PrismaService,
      reservationsServiceMock as never,
    );
  });

  it('retorna somente métricas comerciais dos eventos do organizador', async () => {
    const result = await service.getOverview(organizerId);

    expect(result.summary).toEqual({
      reservationCount: 4,
      paidReservationCount: 2,
      ticketsSold: 3,
      simulatedRevenueCents: 15000,
    });
    expect(result.upcomingEvents[0]).toMatchObject({
      title: 'Festival Demo',
      reservationCount: 3,
      ticketsSold: 2,
      simulatedRevenueCents: 10000,
    });
    expect(result.eventResults[0]).toMatchObject({
      title: 'Festival Demo',
      reservationCount: 3,
      paidReservationCount: 1,
      ticketsSold: 2,
      simulatedRevenueCents: 10000,
    });
    expect(result.recentReservations[0]).toMatchObject({
      id: 'reserva-1',
      quantity: 2,
      ticketsCreated: 2,
      paymentStatus: PaymentStatus.APPROVED,
    });
    expect(prismaMock.ticket.count).toHaveBeenCalledWith({
      where: { event: { organizerId } },
    });
  });

  it('retorna receita zerada quando ainda não existem pagamentos aprovados', async () => {
    prismaMock.payment.aggregate.mockResolvedValue({
      _sum: { amountCents: null },
    });
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.reservation.findMany.mockResolvedValue([]);

    const result = await service.getOverview(organizerId);

    expect(result.summary.simulatedRevenueCents).toBe(0);
    expect(result.upcomingEvents).toEqual([]);
    expect(result.eventResults).toEqual([]);
    expect(result.recentReservations).toEqual([]);
  });
});
