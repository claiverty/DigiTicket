import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventSaleMode,
  EventStatus,
  Prisma,
  ReservationStatus,
  SeatStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    customerId: string,
    eventId: string,
    input: CreateReservationDto,
  ) {
    await this.expirePendingReservations();
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const event = await transaction.event.findFirst({
        where: {
          id: eventId,
          status: EventStatus.PUBLISHED,
          saleMode: EventSaleMode.GENERAL_ADMISSION,
        },
        select: { id: true, startDate: true },
      });

      if (!event) {
        throw new NotFoundException(
          'Evento publicado com entrada geral não encontrado.',
        );
      }

      if (event.startDate <= now) {
        throw new BadRequestException(
          'As reservas deste evento já foram encerradas.',
        );
      }

      const orderedItems = [...input.items].sort((first, second) =>
        first.ticketTypeId.localeCompare(second.ticketTypeId),
      );
      const requestedIds = orderedItems.map((item) => item.ticketTypeId);
      const ticketTypes = await transaction.ticketType.findMany({
        where: { eventId, id: { in: requestedIds } },
      });

      if (ticketTypes.length !== requestedIds.length) {
        throw new BadRequestException(
          'Um ou mais tipos de ingresso não pertencem a este evento.',
        );
      }

      let totalCents = 0;
      const reservationItems: Prisma.ReservationItemCreateWithoutReservationInput[] =
        [];

      for (const requestedItem of orderedItems) {
        const ticketType = ticketTypes.find(
          (item) => item.id === requestedItem.ticketTypeId,
        )!;
        const stockUpdate = await transaction.ticketType.updateMany({
          where: {
            id: ticketType.id,
            eventId,
            availableQuantity: { gte: requestedItem.quantity },
          },
          data: { availableQuantity: { decrement: requestedItem.quantity } },
        });

        // A condição no UPDATE faz somente uma reserva vencer pelo último ingresso.
        if (stockUpdate.count !== 1) {
          throw new ConflictException(
            `Estoque insuficiente para ${ticketType.name}. Atualize as quantidades e tente novamente.`,
          );
        }

        totalCents += ticketType.priceCents * requestedItem.quantity;
        reservationItems.push({
          quantity: requestedItem.quantity,
          unitPriceCents: ticketType.priceCents,
          ticketType: { connect: { id: ticketType.id } },
        });
      }

      return transaction.reservation.create({
        data: {
          customerId,
          eventId,
          totalCents,
          expiresAt: new Date(now.getTime() + RESERVATION_DURATION_MS),
          items: { create: reservationItems },
        },
        include: this.reservationInclude,
      });
    });
  }

  async listByCustomer(customerId: string) {
    await this.expirePendingReservations();
    return this.prisma.reservation.findMany({
      where: { customerId },
      include: this.reservationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCustomer(id: string, customerId: string) {
    await this.expirePendingReservations();
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, customerId },
      include: this.reservationInclude,
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    return reservation;
  }

  async cancel(id: string, customerId: string) {
    await this.expirePendingReservations();

    return this.prisma.$transaction(async (transaction) => {
      const reservation = await transaction.reservation.findFirst({
        where: { id, customerId },
        include: { items: true },
      });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (reservation.status !== ReservationStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          'Somente reservas aguardando pagamento podem ser canceladas.',
        );
      }

      const update = await transaction.reservation.updateMany({
        where: {
          id,
          customerId,
          status: ReservationStatus.PENDING_PAYMENT,
          expiresAt: { gt: new Date() },
        },
        data: { status: ReservationStatus.CANCELLED },
      });

      if (update.count !== 1) {
        throw new ConflictException(
          'A reserva expirou ou já foi alterada. Atualize a página.',
        );
      }

      await this.restoreInventory(transaction, reservation.items);
      await this.releaseSeats(transaction, id);
      return transaction.reservation.findUniqueOrThrow({
        where: { id },
        include: this.reservationInclude,
      });
    });
  }

  async expirePendingReservations(): Promise<number> {
    const expired = await this.prisma.reservation.findMany({
      where: {
        status: ReservationStatus.PENDING_PAYMENT,
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
      orderBy: { expiresAt: 'asc' },
      take: 100,
    });
    let released = 0;

    for (const reservation of expired) {
      const didRelease = await this.prisma.$transaction(async (transaction) => {
        const update = await transaction.reservation.updateMany({
          where: {
            id: reservation.id,
            status: ReservationStatus.PENDING_PAYMENT,
            expiresAt: { lte: new Date() },
          },
          data: { status: ReservationStatus.EXPIRED },
        });

        if (update.count !== 1) {
          return false;
        }

        const items = await transaction.reservationItem.findMany({
          where: { reservationId: reservation.id },
        });
        await this.restoreInventory(transaction, items);
        await this.releaseSeats(transaction, reservation.id);
        return true;
      });

      if (didRelease) released += 1;
    }

    return released;
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

  private async releaseSeats(
    transaction: Prisma.TransactionClient,
    reservationId: string,
  ) {
    await transaction.eventSeat.updateMany({
      where: { reservationId, status: SeatStatus.HELD },
      data: { reservationId: null, status: SeatStatus.AVAILABLE },
    });
  }

  private readonly reservationInclude = {
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
    heldSeats: {
      select: {
        id: true,
        rowLabel: true,
        seatNumber: true,
        ticketTypeId: true,
      },
      orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
    },
    _count: { select: { tickets: true } },
  } satisfies Prisma.ReservationInclude;
}
