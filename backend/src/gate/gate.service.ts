import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EventStatus,
  Prisma,
  TicketStatus,
  TicketTransferStatus,
  TicketValidationMethod,
  TicketValidationResult,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TicketSecurityService } from '../tickets/ticket-security.service';

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketSecurity: TicketSecurityService,
  ) {}

  listEvents() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        venueName: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        _count: { select: { tickets: true } },
      },
    });
  }

  async listValidations(eventId: string) {
    await this.requireEvent(eventId);

    return this.prisma.ticketValidationLog.findMany({
      where: { eventId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        ticket: {
          select: {
            manualCode: true,
            customer: { select: { name: true } },
            ticketType: { select: { name: true } },
          },
        },
        gateUser: { select: { name: true } },
      },
    });
  }

  async validate(eventId: string, gateUserId: string, rawCode: string) {
    await this.requireEvent(eventId);

    const code = rawCode.trim();
    const method = code.toUpperCase().startsWith('DT-')
      ? TicketValidationMethod.MANUAL
      : TicketValidationMethod.QR;
    const codeHash = createHash('sha256').update(code).digest('hex');

    return this.prisma.$transaction(async (transaction) => {
      const ticket = await this.findTicket(transaction, code, method);

      if (!ticket) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          method,
          codeHash,
          result: TicketValidationResult.INVALID,
        });
      }

      if (ticket.eventId !== eventId) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          ticket,
          method,
          codeHash,
          result: TicketValidationResult.WRONG_EVENT,
        });
      }

      if (ticket.transfers.length > 0) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          ticket,
          method,
          codeHash,
          result: TicketValidationResult.INVALID,
        });
      }

      if (ticket.status === TicketStatus.USED) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          ticket,
          method,
          codeHash,
          result: TicketValidationResult.ALREADY_USED,
        });
      }

      if (ticket.status !== TicketStatus.ACTIVE) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          ticket,
          method,
          codeHash,
          result: TicketValidationResult.INVALID,
        });
      }

      const usedAt = new Date();
      const update = await transaction.ticket.updateMany({
        where: {
          id: ticket.id,
          eventId,
          status: TicketStatus.ACTIVE,
          transfers: { none: { status: TicketTransferStatus.PENDING } },
        },
        data: { status: TicketStatus.USED, usedAt },
      });

      if (update.count === 1) {
        return this.recordResult(transaction, {
          eventId,
          gateUserId,
          ticket: { ...ticket, status: TicketStatus.USED, usedAt },
          method,
          codeHash,
          result: TicketValidationResult.VALID,
        });
      }

      const currentTicket = await transaction.ticket.findUnique({
        where: { id: ticket.id },
        include: this.ticketInclude,
      });

      return this.recordResult(transaction, {
        eventId,
        gateUserId,
        ticket: currentTicket ?? ticket,
        method,
        codeHash,
        result:
          currentTicket?.status === TicketStatus.USED
            ? TicketValidationResult.ALREADY_USED
            : TicketValidationResult.INVALID,
      });
    });
  }

  private requireEvent(eventId: string) {
    return this.prisma.event
      .findFirst({ where: { id: eventId, status: EventStatus.PUBLISHED } })
      .then((event) => {
        if (!event) {
          throw new NotFoundException('Evento não encontrado para validação.');
        }

        return event;
      });
  }

  private findTicket(
    transaction: Prisma.TransactionClient,
    code: string,
    method: TicketValidationMethod,
  ) {
    if (method === TicketValidationMethod.MANUAL) {
      return transaction.ticket.findUnique({
        where: { manualCode: code.toUpperCase() },
        include: this.ticketInclude,
      });
    }

    if (!this.ticketSecurity.verify(code)) {
      return null;
    }

    const [ticketCode] = code.split('.');
    return transaction.ticket.findUnique({
      where: { ticketCode },
      include: this.ticketInclude,
    });
  }

  private async recordResult(
    transaction: Prisma.TransactionClient,
    data: ValidationData,
  ) {
    await transaction.ticketValidationLog.create({
      data: {
        ticketId: data.ticket?.id,
        eventId: data.eventId,
        gateUserId: data.gateUserId,
        result: data.result,
        method: data.method,
        presentedCodeHash: data.codeHash,
      },
    });

    return {
      result: data.result,
      message: resultMessages[data.result],
      validatedAt: new Date(),
      ticket: data.ticket ? this.toTicketResponse(data.ticket) : null,
    };
  }

  private toTicketResponse(ticket: TicketWithRelations) {
    return {
      id: ticket.id,
      manualCode: ticket.manualCode,
      status: ticket.status,
      usedAt: ticket.usedAt,
      customer: ticket.customer,
      ticketType: ticket.ticketType,
      event: ticket.event,
    };
  }

  private readonly ticketInclude = {
    customer: { select: { name: true } },
    ticketType: { select: { name: true } },
    event: { select: { id: true, title: true } },
    transfers: {
      where: { status: TicketTransferStatus.PENDING },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.TicketInclude;
}

const resultMessages: Record<TicketValidationResult, string> = {
  VALID: 'Ingresso válido. Entrada liberada.',
  INVALID: 'Ingresso inválido ou cancelado.',
  WRONG_EVENT: 'Este ingresso pertence a outro evento.',
  ALREADY_USED: 'Este ingresso já foi utilizado.',
};

type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    customer: { select: { name: true } };
    ticketType: { select: { name: true } };
    event: { select: { id: true; title: true } };
    transfers: {
      where: { status: 'PENDING' };
      select: { id: true };
      take: 1;
    };
  };
}>;

interface ValidationData {
  eventId: string;
  gateUserId: string;
  ticket?: TicketWithRelations;
  method: TicketValidationMethod;
  codeHash: string;
  result: TicketValidationResult;
}
