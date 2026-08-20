import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  ReservationStatus,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from '../reservations/reservations.service';
import { PaymentSimulatorService } from './payment-simulator.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
    private readonly simulator: PaymentSimulatorService,
  ) {}

  async simulate(
    reservationId: string,
    customerId: string,
    requestedOutcome: PaymentStatus,
  ) {
    await this.reservationsService.expirePendingReservations();
    const outcome = this.simulator.simulate(requestedOutcome);

    return this.prisma.$transaction(async (transaction) => {
      const reservation = await transaction.reservation.findFirst({
        where: { id: reservationId, customerId },
        include: { items: true },
      });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (reservation.status !== ReservationStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          'Esta reserva não está disponível para pagamento.',
        );
      }

      const now = new Date();
      if (reservation.expiresAt <= now) {
        throw new BadRequestException(
          'A reserva expirou antes da confirmação do pagamento.',
        );
      }

      const calculatedTotal = reservation.items.reduce(
        (total, item) => total + item.unitPriceCents * item.quantity,
        0,
      );

      if (calculatedTotal !== reservation.totalCents) {
        throw new ConflictException(
          'O total da reserva está inconsistente. O pagamento foi interrompido.',
        );
      }

      const reservationStatus =
        outcome === PaymentStatus.APPROVED
          ? ReservationStatus.PAID
          : ReservationStatus.DECLINED;
      const statusUpdate = await transaction.reservation.updateMany({
        where: {
          id: reservationId,
          customerId,
          status: ReservationStatus.PENDING_PAYMENT,
          expiresAt: { gt: now },
        },
        data: { status: reservationStatus },
      });

      // A condição impede duas confirmações simultâneas para a mesma reserva.
      if (statusUpdate.count !== 1) {
        throw new ConflictException(
          'A reserva expirou ou já recebeu uma tentativa de pagamento.',
        );
      }

      const payment = await transaction.payment.create({
        data: {
          reservationId,
          status: outcome,
          amountCents: calculatedTotal,
        },
      });

      let ticketsCreated = 0;

      if (outcome === PaymentStatus.APPROVED) {
        const tickets: Prisma.TicketCreateManyInput[] = [];

        for (const item of reservation.items) {
          for (let unit = 0; unit < item.quantity; unit += 1) {
            tickets.push({
              eventId: reservation.eventId,
              customerId,
              reservationId,
              reservationItemId: item.id,
              ticketTypeId: item.ticketTypeId,
              status: TicketStatus.ACTIVE,
            });
          }
        }

        const created = await transaction.ticket.createMany({ data: tickets });
        ticketsCreated = created.count;
      } else {
        await this.restoreInventory(transaction, reservation.items);
      }

      const updatedReservation =
        await transaction.reservation.findUniqueOrThrow({
          where: { id: reservationId },
          include: {
            event: {
              select: {
                id: true,
                slug: true,
                title: true,
                posterUrl: true,
                venueName: true,
                city: true,
                state: true,
                startDate: true,
              },
            },
            items: {
              include: {
                ticketType: { select: { id: true, name: true } },
              },
            },
            payment: true,
            _count: { select: { tickets: true } },
          },
        });

      return { payment, reservation: updatedReservation, ticketsCreated };
    });
  }

  private async restoreInventory(
    transaction: Prisma.TransactionClient,
    items: Array<{ ticketTypeId: string; quantity: number }>,
  ) {
    for (const item of items) {
      await transaction.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { availableQuantity: { increment: item.quantity } },
      });
    }
  }
}
