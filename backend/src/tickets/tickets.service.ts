import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketSecurityService } from './ticket-security.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly security: TicketSecurityService,
  ) {}

  async listByCustomer(customerId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { customerId },
      include: this.ticketInclude,
      orderBy: [{ event: { startDate: 'asc' } }, { createdAt: 'desc' }],
    });

    return tickets.map((ticket) => this.toResponse(ticket));
  }

  async findByCustomer(id: string, customerId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, customerId },
      include: this.ticketInclude,
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado.');
    }

    return this.toResponse(ticket);
  }

  async createShare(id: string, customerId: string) {
    const ticket = await this.requireOwnedTicket(id, customerId);

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(
        'Somente ingressos ativos podem ser compartilhados.',
      );
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        shareToken: this.security.createShareToken(),
        sharedAt: new Date(),
      },
      include: this.ticketInclude,
    });

    return this.toResponse(updated);
  }

  async revokeShare(id: string, customerId: string) {
    await this.requireOwnedTicket(id, customerId);
    await this.prisma.ticket.update({
      where: { id },
      data: { shareToken: null, sharedAt: null },
    });
  }

  async findShared(shareToken: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { shareToken },
      include: this.ticketInclude,
    });

    if (!ticket || !ticket.shareToken) {
      throw new NotFoundException(
        'Link de ingresso inválido, revogado ou inexistente.',
      );
    }

    return {
      status: ticket.status,
      usedAt: ticket.usedAt,
      manualCode: ticket.manualCode,
      qrToken: this.security.sign(ticket.ticketCode, ticket.eventId),
      event: ticket.event,
      ticketType: ticket.ticketType,
      customer: ticket.customer,
    };
  }

  private async requireOwnedTicket(id: string, customerId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, customerId },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado.');
    }

    return ticket;
  }

  private toResponse(ticket: TicketWithRelations) {
    return {
      ...ticket,
      qrToken: this.security.sign(ticket.ticketCode, ticket.eventId),
    };
  }

  private readonly ticketInclude = {
    event: {
      select: {
        id: true,
        slug: true,
        title: true,
        posterUrl: true,
        venueName: true,
        address: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
      },
    },
    ticketType: { select: { id: true, name: true } },
    customer: { select: { name: true } },
  } satisfies Prisma.TicketInclude;
}

type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    event: {
      select: {
        id: true;
        slug: true;
        title: true;
        posterUrl: true;
        venueName: true;
        address: true;
        city: true;
        state: true;
        startDate: true;
        endDate: true;
      };
    };
    ticketType: { select: { id: true; name: true } };
    customer: { select: { name: true } };
  };
}>;
