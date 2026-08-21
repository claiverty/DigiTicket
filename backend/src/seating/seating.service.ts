import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSaleMode, EventStatus, Prisma, SeatStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from '../reservations/reservations.service';
import type { CreateSeatReservationDto } from './dto/create-seat-reservation.dto';
import type { CreateSeatSectionDto } from './dto/create-seat-section.dto';
import type { UpdateSeatSectionDto } from './dto/update-seat-section.dto';

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

@Injectable()
export class SeatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async listPublic(eventId: string) {
    await this.reservationsService.expirePendingReservations();
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: EventStatus.PUBLISHED,
        saleMode: EventSaleMode.RESERVED_SEATING,
      },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException(
        'Evento com assentos reservados não encontrado.',
      );
    }

    return this.listSeats(eventId);
  }

  async listByOrganizer(eventId: string, organizerId: string) {
    await this.requireConfigurableEvent(eventId, organizerId);
    return this.listSeats(eventId);
  }

  async createSection(
    eventId: string,
    organizerId: string,
    input: CreateSeatSectionDto,
  ) {
    await this.requireConfigurableEvent(eventId, organizerId);
    const capacity = input.rows * input.seatsPerRow;

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existingRows = await transaction.eventSeat.findMany({
          where: { eventId },
          select: { rowLabel: true },
          distinct: ['rowLabel'],
        });
        const firstRowIndex = existingRows.reduce(
          (highest, row) => Math.max(highest, row.rowLabel.charCodeAt(0) - 64),
          0,
        );

        if (firstRowIndex + input.rows > 26) {
          throw new BadRequestException(
            'O mapa simples permite no máximo 26 fileiras no total.',
          );
        }

        const ticketType = await transaction.ticketType.create({
          data: {
            eventId,
            name: input.name.trim(),
            priceCents: input.priceCents,
            capacity,
            availableQuantity: capacity,
            seatDisplaySize: input.seatDisplaySize,
          },
        });
        const seats: Prisma.EventSeatCreateManyInput[] = [];

        for (let row = 0; row < input.rows; row += 1) {
          const rowLabel = String.fromCharCode(65 + firstRowIndex + row);
          for (
            let seatNumber = 1;
            seatNumber <= input.seatsPerRow;
            seatNumber += 1
          ) {
            seats.push({
              eventId,
              ticketTypeId: ticketType.id,
              rowLabel,
              seatNumber,
            });
          }
        }

        await transaction.eventSeat.createMany({ data: seats });
        return ticketType;
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um setor com esse nome.');
      }
      throw error;
    }
  }

  async removeSection(
    eventId: string,
    ticketTypeId: string,
    organizerId: string,
  ) {
    await this.requireConfigurableEvent(eventId, organizerId);
    const section = await this.prisma.ticketType.findFirst({
      where: { id: ticketTypeId, eventId },
      select: { id: true },
    });

    if (!section) throw new NotFoundException('Setor não encontrado.');

    await this.prisma.$transaction(async (transaction) => {
      await transaction.eventSeat.deleteMany({
        where: { eventId, ticketTypeId },
      });
      await transaction.ticketType.delete({ where: { id: ticketTypeId } });
    });
  }

  async updateSection(
    eventId: string,
    ticketTypeId: string,
    organizerId: string,
    input: UpdateSeatSectionDto,
  ) {
    await this.requireConfigurableEvent(eventId, organizerId);
    const updated = await this.prisma.ticketType.updateMany({
      where: { id: ticketTypeId, eventId },
      data: { seatDisplaySize: input.seatDisplaySize },
    });
    if (updated.count !== 1)
      throw new NotFoundException('Setor não encontrado.');
    return this.prisma.ticketType.findUniqueOrThrow({
      where: { id: ticketTypeId },
    });
  }

  async createReservation(
    customerId: string,
    eventId: string,
    input: CreateSeatReservationDto,
  ) {
    await this.reservationsService.expirePendingReservations();
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const event = await transaction.event.findFirst({
        where: {
          id: eventId,
          status: EventStatus.PUBLISHED,
          saleMode: EventSaleMode.RESERVED_SEATING,
          startDate: { gt: now },
        },
        select: { id: true },
      });
      if (!event)
        throw new NotFoundException(
          'Evento disponível para reserva não encontrado.',
        );

      const seats = await transaction.eventSeat.findMany({
        where: { eventId, id: { in: input.seatIds } },
        include: { ticketType: true },
        orderBy: [
          { ticketTypeId: 'asc' },
          { rowLabel: 'asc' },
          { seatNumber: 'asc' },
        ],
      });
      if (seats.length !== input.seatIds.length) {
        throw new BadRequestException(
          'Um ou mais assentos não pertencem a este evento.',
        );
      }

      const grouped = new Map<
        string,
        { quantity: number; priceCents: number }
      >();
      for (const seat of seats) {
        const item = grouped.get(seat.ticketTypeId);
        grouped.set(seat.ticketTypeId, {
          quantity: (item?.quantity ?? 0) + 1,
          priceCents: seat.ticketType.priceCents,
        });
      }
      const totalCents = [...grouped.values()].reduce(
        (total, item) => total + item.quantity * item.priceCents,
        0,
      );
      const reservation = await transaction.reservation.create({
        data: {
          customerId,
          eventId,
          totalCents,
          expiresAt: new Date(now.getTime() + RESERVATION_DURATION_MS),
          items: {
            create: [...grouped.entries()].map(([ticketTypeId, item]) => ({
              ticketTypeId,
              quantity: item.quantity,
              unitPriceCents: item.priceCents,
            })),
          },
        },
      });

      for (const seat of seats) {
        const claimed = await transaction.eventSeat.updateMany({
          where: { id: seat.id, eventId, status: SeatStatus.AVAILABLE },
          data: { status: SeatStatus.HELD, reservationId: reservation.id },
        });
        if (claimed.count !== 1) {
          throw new ConflictException(
            `O assento ${seat.rowLabel}${seat.seatNumber} acabou de ser selecionado por outra pessoa.`,
          );
        }
      }

      for (const [ticketTypeId, item] of grouped) {
        const updated = await transaction.ticketType.updateMany({
          where: {
            id: ticketTypeId,
            availableQuantity: { gte: item.quantity },
          },
          data: { availableQuantity: { decrement: item.quantity } },
        });
        if (updated.count !== 1)
          throw new ConflictException(
            'A disponibilidade do setor foi alterada.',
          );
      }

      return transaction.reservation.findUniqueOrThrow({
        where: { id: reservation.id },
        include: this.reservationInclude,
      });
    });
  }

  private listSeats(eventId: string) {
    return this.prisma.eventSeat.findMany({
      where: { eventId },
      orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
      select: {
        id: true,
        eventId: true,
        ticketTypeId: true,
        rowLabel: true,
        seatNumber: true,
        status: true,
        ticketType: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            seatDisplaySize: true,
          },
        },
      },
    });
  }

  private async requireConfigurableEvent(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    if (event.saleMode !== EventSaleMode.RESERVED_SEATING) {
      throw new BadRequestException('Este evento utiliza entrada geral.');
    }
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'O mapa só pode ser alterado enquanto o evento está em rascunho.',
      );
    }
    return event;
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
    items: { include: { ticketType: { select: { id: true, name: true } } } },
    heldSeats: {
      select: {
        id: true,
        rowLabel: true,
        seatNumber: true,
        ticketTypeId: true,
      },
      orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
    },
    payment: true,
    _count: { select: { tickets: true } },
  } satisfies Prisma.ReservationInclude;
}
