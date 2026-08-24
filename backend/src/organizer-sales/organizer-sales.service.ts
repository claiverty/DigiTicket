import { Injectable } from '@nestjs/common';
import { EventStatus, PaymentStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class OrganizerSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async getOverview(organizerId: string) {
    await this.reservationsService.expirePendingReservations();
    const eventFilter = { organizerId };

    const [
      reservationCount,
      paidReservationCount,
      ticketsSold,
      revenue,
      events,
      recentReservations,
    ] = await Promise.all([
      this.prisma.reservation.count({ where: { event: eventFilter } }),
      this.prisma.reservation.count({
        where: { event: eventFilter, status: ReservationStatus.PAID },
      }),
      this.prisma.ticket.count({ where: { event: eventFilter } }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.APPROVED,
          reservation: { event: eventFilter },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.event.findMany({
        where: { organizerId },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          posterUrl: true,
          venueName: true,
          city: true,
          state: true,
          startDate: true,
          _count: { select: { reservations: true, tickets: true } },
          reservations: {
            where: { status: ReservationStatus.PAID },
            select: {
              payment: { select: { status: true, amountCents: true } },
            },
          },
        },
      }),
      this.prisma.reservation.findMany({
        where: { event: eventFilter },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          totalCents: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
          event: { select: { id: true, title: true } },
          items: { select: { quantity: true } },
          payment: { select: { status: true } },
          _count: { select: { tickets: true } },
        },
      }),
    ]);

    const eventResults = events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      posterUrl: event.posterUrl,
      venueName: event.venueName,
      city: event.city,
      state: event.state,
      startDate: event.startDate,
      reservationCount: event._count.reservations,
      paidReservationCount: event.reservations.filter(
        (reservation) => reservation.payment?.status === PaymentStatus.APPROVED,
      ).length,
      ticketsSold: event._count.tickets,
      simulatedRevenueCents: event.reservations.reduce(
        (total, reservation) =>
          total +
          (reservation.payment?.status === PaymentStatus.APPROVED
            ? reservation.payment.amountCents
            : 0),
        0,
      ),
    }));

    return {
      summary: {
        reservationCount,
        paidReservationCount,
        ticketsSold,
        simulatedRevenueCents: revenue._sum.amountCents ?? 0,
      },
      eventResults,
      upcomingEvents: eventResults
        .filter(
          (event) =>
            event.status === EventStatus.PUBLISHED &&
            event.startDate >= new Date(),
        )
        .sort(
          (first, second) =>
            first.startDate.getTime() - second.startDate.getTime(),
        )
        .slice(0, 5),
      recentReservations: recentReservations.map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        totalCents: reservation.totalCents,
        createdAt: reservation.createdAt,
        customer: reservation.customer,
        event: reservation.event,
        quantity: reservation.items.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
        ticketsCreated: reservation._count.tickets,
        paymentStatus: reservation.payment?.status ?? null,
      })),
    };
  }
}
