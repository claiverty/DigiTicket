import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventSaleMode, EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketTypesService } from './ticket-types.service';

describe('TicketTypesService', () => {
  const organizerId = '14f5f2ca-a7a9-46a1-af8c-48ad07261e34';
  const eventId = '4863d735-a2c5-45ea-a759-a9d9d963ab91';
  const ticketTypeId = 'd49636a3-0d41-426c-a29a-6ae1a4f7deef';
  const ticketType = {
    id: ticketTypeId,
    eventId,
    name: 'Pista',
    description: null,
    priceCents: 5000,
    capacity: 100,
    availableQuantity: 80,
  };

  function createContext() {
    const prisma = {
      event: {
        findFirst: jest.fn().mockResolvedValue({
          id: eventId,
          organizerId,
          status: EventStatus.DRAFT,
          saleMode: EventSaleMode.GENERAL_ADMISSION,
        }),
      },
      ticketType: {
        findFirst: jest.fn().mockResolvedValue(ticketType),
        update: jest.fn().mockResolvedValue(ticketType),
      },
    };
    return {
      prisma,
      service: new TicketTypesService(prisma as unknown as PrismaService),
    };
  }

  it('impede reduzir a capacidade abaixo da quantidade já reservada', async () => {
    const { service, prisma } = createContext();

    await expect(
      service.update(ticketTypeId, eventId, organizerId, { capacity: 19 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.ticketType.update).not.toHaveBeenCalled();
  });

  it('recalcula a disponibilidade ao ampliar a capacidade', async () => {
    const { service, prisma } = createContext();

    await service.update(ticketTypeId, eventId, organizerId, {
      capacity: 120,
    });

    expect(prisma.ticketType.update).toHaveBeenCalledWith({
      where: { id: ticketTypeId },
      data: expect.objectContaining({
        capacity: 120,
        availableQuantity: 100,
      }) as object,
    });
  });

  it('não permite configurar ingressos de evento pertencente a outro organizador', async () => {
    const { service, prisma } = createContext();
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.list(eventId, 'outro-organizador'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('mantém tipos por quantidade fora de eventos com assentos reservados', async () => {
    const { service, prisma } = createContext();
    prisma.event.findFirst.mockResolvedValue({
      id: eventId,
      organizerId,
      status: EventStatus.DRAFT,
      saleMode: EventSaleMode.RESERVED_SEATING,
    });

    await expect(service.list(eventId, organizerId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
