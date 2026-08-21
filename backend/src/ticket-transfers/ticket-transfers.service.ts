import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  Prisma,
  Role,
  TicketStatus,
  TicketTransferStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketSecurityService } from '../tickets/ticket-security.service';

@Injectable()
export class TicketTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketSecurity: TicketSecurityService,
  ) {}

  listIncoming(recipientId: string) {
    return this.prisma.ticketTransfer.findMany({
      where: { recipientId },
      include: this.transferInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  listOutgoing(senderId: string) {
    return this.prisma.ticketTransfer.findMany({
      where: { senderId },
      include: this.transferInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ticketId: string, senderId: string, recipientEmail: string) {
    const normalizedEmail = recipientEmail.trim().toLowerCase();
    const [recipient, ticket] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: normalizedEmail } }),
      this.prisma.ticket.findFirst({
        where: { id: ticketId, customerId: senderId },
        include: {
          event: { select: { status: true } },
          transfers: {
            where: { status: TicketTransferStatus.PENDING },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado.');
    }

    if (!recipient || recipient.role !== Role.CUSTOMER) {
      throw new NotFoundException(
        'Não encontramos uma conta de cliente com esse e-mail.',
      );
    }

    if (recipient.id === senderId) {
      throw new BadRequestException(
        'O ingresso já pertence à conta informada.',
      );
    }

    if (
      ticket.status !== TicketStatus.ACTIVE ||
      ticket.event.status !== EventStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Somente ingressos ativos de eventos publicados podem ser transferidos.',
      );
    }

    if (ticket.transfers.length > 0) {
      throw new ConflictException(
        'Este ingresso já possui uma transferência pendente.',
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const lockedTicket = await transaction.ticket.updateMany({
          where: {
            id: ticketId,
            customerId: senderId,
            status: TicketStatus.ACTIVE,
            transfers: { none: { status: TicketTransferStatus.PENDING } },
          },
          data: { shareToken: null, sharedAt: null },
        });

        if (lockedTicket.count !== 1) {
          throw new ConflictException(
            'O ingresso mudou de estado. Atualize a página e tente novamente.',
          );
        }

        return transaction.ticketTransfer.create({
          data: { ticketId, senderId, recipientId: recipient.id },
          include: this.transferInclude,
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este ingresso já possui uma transferência pendente.',
        );
      }

      throw error;
    }
  }

  async accept(id: string, recipientId: string) {
    const transfer = await this.requirePendingTransfer({ id, recipientId });
    const ticketCode = this.ticketSecurity.createTicketCode();
    const manualCode = this.ticketSecurity.createManualCode();

    return this.prisma.$transaction(async (transaction) => {
      const resolved = await transaction.ticketTransfer.updateMany({
        where: { id, recipientId, status: TicketTransferStatus.PENDING },
        data: {
          status: TicketTransferStatus.ACCEPTED,
          resolvedAt: new Date(),
        },
      });

      if (resolved.count !== 1) {
        throw new ConflictException('Esta transferência já foi finalizada.');
      }

      const changedOwner = await transaction.ticket.updateMany({
        where: {
          id: transfer.ticketId,
          customerId: transfer.senderId,
          status: TicketStatus.ACTIVE,
          transfers: {
            some: { id, status: TicketTransferStatus.ACCEPTED },
          },
        },
        data: {
          customerId: recipientId,
          ticketCode,
          manualCode,
          shareToken: null,
          sharedAt: null,
        },
      });

      if (changedOwner.count !== 1) {
        throw new ConflictException(
          'O ingresso não está mais disponível para transferência.',
        );
      }

      return transaction.ticketTransfer.findUniqueOrThrow({
        where: { id },
        include: this.transferInclude,
      });
    });
  }

  async decline(id: string, recipientId: string) {
    await this.requirePendingTransfer({ id, recipientId });
    return this.resolveWithoutChangingOwner(
      { id, recipientId },
      TicketTransferStatus.DECLINED,
    );
  }

  async cancel(id: string, senderId: string) {
    await this.requirePendingTransfer({ id, senderId });
    return this.resolveWithoutChangingOwner(
      { id, senderId },
      TicketTransferStatus.CANCELLED,
    );
  }

  private async resolveWithoutChangingOwner(
    owner: { id: string; senderId?: string; recipientId?: string },
    status: TicketTransferStatus,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const resolved = await transaction.ticketTransfer.updateMany({
        where: { ...owner, status: TicketTransferStatus.PENDING },
        data: { status, resolvedAt: new Date() },
      });

      if (resolved.count !== 1) {
        throw new ConflictException('Esta transferência já foi finalizada.');
      }

      return transaction.ticketTransfer.findUniqueOrThrow({
        where: { id: owner.id },
        include: this.transferInclude,
      });
    });
  }

  private async requirePendingTransfer(where: {
    id: string;
    senderId?: string;
    recipientId?: string;
  }) {
    const transfer = await this.prisma.ticketTransfer.findFirst({
      where: { ...where, status: TicketTransferStatus.PENDING },
    });

    if (!transfer) {
      throw new NotFoundException(
        'Transferência pendente não encontrada ou sem permissão de acesso.',
      );
    }

    return transfer;
  }

  private readonly transferInclude = {
    sender: { select: { id: true, name: true, email: true } },
    recipient: { select: { id: true, name: true, email: true } },
    ticket: {
      select: {
        id: true,
        manualCode: true,
        status: true,
        customer: { select: { id: true, name: true } },
        event: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            venueName: true,
            city: true,
            state: true,
            startDate: true,
          },
        },
        ticketType: { select: { id: true, name: true } },
      },
    },
  } satisfies Prisma.TicketTransferInclude;
}
