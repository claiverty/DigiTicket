import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSaleMode, EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import type { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(eventId: string, organizerId: string) {
    await this.requireOwnedGeneralAdmissionEvent(eventId, organizerId);
    return this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: [{ priceCents: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    eventId: string,
    organizerId: string,
    input: CreateTicketTypeDto,
  ) {
    await this.requireOwnedGeneralAdmissionEvent(eventId, organizerId);

    try {
      return await this.prisma.ticketType.create({
        data: {
          eventId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          priceCents: input.priceCents,
          capacity: input.capacity,
          availableQuantity: input.capacity,
        },
      });
    } catch (error) {
      this.rethrowNameConflict(error);
    }
  }

  async update(
    id: string,
    eventId: string,
    organizerId: string,
    input: UpdateTicketTypeDto,
  ) {
    await this.requireOwnedGeneralAdmissionEvent(eventId, organizerId);
    const ticketType = await this.prisma.ticketType.findFirst({
      where: { id, eventId },
    });

    if (!ticketType) {
      throw new NotFoundException('Tipo de ingresso não encontrado.');
    }

    const capacity = input.capacity ?? ticketType.capacity;
    const reservedQuantity = ticketType.capacity - ticketType.availableQuantity;

    if (capacity < reservedQuantity) {
      throw new BadRequestException(
        `A capacidade não pode ser menor que ${reservedQuantity}, pois essa quantidade já está reservada.`,
      );
    }

    try {
      return await this.prisma.ticketType.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          description:
            input.description === undefined
              ? undefined
              : input.description.trim() || null,
          priceCents: input.priceCents,
          capacity: input.capacity,
          availableQuantity:
            input.capacity === undefined
              ? undefined
              : ticketType.availableQuantity +
                (input.capacity - ticketType.capacity),
        },
      });
    } catch (error) {
      this.rethrowNameConflict(error);
    }
  }

  async remove(id: string, eventId: string, organizerId: string) {
    await this.requireOwnedGeneralAdmissionEvent(eventId, organizerId);
    const ticketType = await this.prisma.ticketType.findFirst({
      where: { id, eventId },
      select: { id: true },
    });

    if (!ticketType) {
      throw new NotFoundException('Tipo de ingresso não encontrado.');
    }

    const reservations = await this.prisma.reservationItem.count({
      where: { ticketTypeId: id },
    });

    if (reservations > 0) {
      throw new BadRequestException(
        'Tipos de ingresso com histórico de reservas não podem ser excluídos.',
      );
    }

    await this.prisma.ticketType.delete({ where: { id } });
  }

  private async requireOwnedGeneralAdmissionEvent(
    eventId: string,
    organizerId: string,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível configurar ingressos de um evento cancelado.',
      );
    }

    if (event.saleMode !== EventSaleMode.GENERAL_ADMISSION) {
      throw new BadRequestException(
        'Tipos por quantidade são exclusivos de eventos com entrada geral.',
      );
    }

    return event;
  }

  private rethrowNameConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Já existe um tipo de ingresso com esse nome no evento.',
      );
    }

    throw error;
  }
}
