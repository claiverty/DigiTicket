import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  EventStatus,
  Role,
  TicketStatus,
  TicketTransferStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketTransfersService } from './ticket-transfers.service';

describe('TicketTransfersService', () => {
  const senderId = '10cc7a68-f3e7-46df-8414-cfef2f4966a5';
  const recipientId = 'f4fcaa9c-80ca-441e-ad9c-f671a857b1da';
  const ticketId = '7965b7bd-e929-4dd7-8649-f2e4f938bc7a';
  const transferId = '65ef453d-2a41-490c-b3a5-f675147c5b4d';
  const recipient = {
    id: recipientId,
    name: 'Cliente Destino',
    email: 'destino@email.com',
    role: Role.CUSTOMER,
  };
  const ticket = {
    id: ticketId,
    customerId: senderId,
    status: TicketStatus.ACTIVE,
    event: { status: EventStatus.PUBLISHED },
    transfers: [],
  };
  const transfer = {
    id: transferId,
    ticketId,
    senderId,
    recipientId,
    status: TicketTransferStatus.PENDING,
  };

  function createContext() {
    const transaction = {
      ticket: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      ticketTransfer: {
        create: jest.fn().mockResolvedValue(transfer),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...transfer,
          status: TicketTransferStatus.ACCEPTED,
        }),
      },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(recipient) },
      ticket: { findFirst: jest.fn().mockResolvedValue(ticket) },
      ticketTransfer: {
        findFirst: jest.fn().mockResolvedValue(transfer),
      },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const security = {
      createTicketCode: jest.fn().mockReturnValue('novo-ticket-code'),
      createManualCode: jest.fn().mockReturnValue('DT-NOVO-CODE-0001'),
    };
    const service = new TicketTransfersService(
      prisma as unknown as PrismaService,
      security as never,
    );

    return { service, prisma, transaction };
  }

  it('cria uma solicitação e revoga o compartilhamento atual', async () => {
    const { service, transaction } = createContext();

    await service.create(ticketId, senderId, recipient.email);

    expect(transaction.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticketId,
        customerId: senderId,
        status: TicketStatus.ACTIVE,
        transfers: { none: { status: TicketTransferStatus.PENDING } },
      },
      data: { shareToken: null, sharedAt: null },
    });
    expect(transaction.ticketTransfer.create).toHaveBeenCalledWith({
      data: { ticketId, senderId, recipientId },
      include: expect.any(Object) as object,
    });
  });

  it('impede transferir para a própria conta', async () => {
    const { service, prisma } = createContext();
    prisma.user.findUnique.mockResolvedValue({ ...recipient, id: senderId });

    await expect(
      service.create(ticketId, senderId, recipient.email),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aceita a transferência e troca titular e códigos na mesma transação', async () => {
    const { service, transaction } = createContext();

    await service.accept(transferId, recipientId);

    expect(transaction.ticketTransfer.updateMany).toHaveBeenCalledWith({
      where: {
        id: transferId,
        recipientId,
        status: TicketTransferStatus.PENDING,
      },
      data: {
        status: TicketTransferStatus.ACCEPTED,
        resolvedAt: expect.any(Date) as Date,
      },
    });
    expect(transaction.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticketId,
        customerId: senderId,
        status: TicketStatus.ACTIVE,
        transfers: {
          some: {
            id: transferId,
            status: TicketTransferStatus.ACCEPTED,
          },
        },
      },
      data: {
        customerId: recipientId,
        ticketCode: 'novo-ticket-code',
        manualCode: 'DT-NOVO-CODE-0001',
        shareToken: null,
        sharedAt: null,
      },
    });
  });

  it('reverte o aceite quando o ingresso mudou de estado', async () => {
    const { service, transaction } = createContext();
    transaction.ticket.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.accept(transferId, recipientId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
