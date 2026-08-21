import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  const customerId = '14f5f2ca-a7a9-46a1-af8c-48ad07261e34';
  const ticketId = '632c3cc5-f979-49a8-9305-8b0e53262a73';
  const ticket = {
    id: ticketId,
    customerId,
    eventId: '4863d735-a2c5-45ea-a759-a9d9d963ab91',
    ticketCode: 'ticket-code',
    status: TicketStatus.ACTIVE,
    shareToken: null,
    event: { title: 'Evento' },
    ticketType: { name: 'VIP' },
    seat: { rowLabel: 'A', seatNumber: 1 },
    customer: { name: 'Cliente' },
    transfers: [],
  };

  function createContext() {
    const prisma = {
      ticket: {
        findFirst: jest.fn().mockResolvedValue(ticket),
        findUnique: jest.fn().mockResolvedValue(ticket),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...ticket,
          shareToken: 'share-token',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
    };
    const security = {
      createShareToken: jest.fn().mockReturnValue('share-token'),
      sign: jest.fn().mockReturnValue('qr-assinado'),
    };
    const service = new TicketsService(
      prisma as unknown as PrismaService,
      security as never,
    );
    return { service, prisma, security };
  }

  it('não revela um ingresso que pertence a outro cliente', async () => {
    const { service, prisma } = createContext();
    prisma.ticket.findFirst.mockResolvedValue(null);

    await expect(
      service.findByCustomer(ticketId, 'outro-cliente'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gera compartilhamento somente após a atualização condicional', async () => {
    const { service, prisma, security } = createContext();

    const result = await service.createShare(ticketId, customerId);

    expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticketId,
        customerId,
        status: TicketStatus.ACTIVE,
        transfers: { none: { status: 'PENDING' } },
      },
      data: { shareToken: 'share-token', sharedAt: expect.any(Date) as Date },
    });
    expect(result.qrToken).toBe('qr-assinado');
    expect(security.sign).toHaveBeenCalledWith(
      ticket.ticketCode,
      ticket.eventId,
    );
  });

  it('interrompe o compartilhamento quando surge uma transferência concorrente', async () => {
    const { service, prisma } = createContext();
    prisma.ticket.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.createShare(ticketId, customerId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.ticket.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('invalida link público durante uma transferência pendente', async () => {
    const { service, prisma } = createContext();
    prisma.ticket.findUnique.mockResolvedValue({
      ...ticket,
      shareToken: 'share-token',
      transfers: [{ id: 'transfer-id' }],
    });

    await expect(service.findShared('share-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
