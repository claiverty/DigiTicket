import {
  TicketStatus,
  TicketValidationMethod,
  TicketValidationResult,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GateService } from './gate.service';

describe('GateService', () => {
  const eventId = '05db15dd-74df-421d-94ea-d3b0ccf5629e';
  const otherEventId = '65ef453d-2a41-490c-b3a5-f675147c5b4d';
  const gateUserId = 'f4fcaa9c-80ca-441e-ad9c-f671a857b1da';
  const ticket = {
    id: '7965b7bd-e929-4dd7-8649-f2e4f938bc7a',
    eventId,
    customerId: '10cc7a68-f3e7-46df-8414-cfef2f4966a5',
    reservationId: '954fdf2a-21e8-4525-8d85-18c2c9de3305',
    reservationItemId: '08088f0a-c547-474e-99ca-457cd6c728f2',
    ticketTypeId: '953cf28b-ddc0-4bd5-9326-c94ca7fd44cc',
    ticketCode: 'ticket-code',
    manualCode: 'DT-AAAA-BBBB-CCCC',
    shareToken: null,
    sharedAt: null,
    status: TicketStatus.ACTIVE,
    usedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: { name: 'Cliente Demo' },
    ticketType: { name: 'Pista' },
    event: { id: eventId, title: 'Festival Demo' },
  };

  function createContext() {
    const transaction = {
      ticket: {
        findUnique: jest.fn().mockResolvedValue(ticket),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ticketValidationLog: {
        create: jest.fn().mockResolvedValue({ id: 'validation-id' }),
      },
    };
    const prisma = {
      event: { findFirst: jest.fn().mockResolvedValue({ id: eventId }) },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const security = { verify: jest.fn().mockReturnValue(true) };
    const service = new GateService(
      prisma as unknown as PrismaService,
      security as never,
    );

    return { service, transaction, security };
  }

  it('consome um ingresso ativo e registra a validação', async () => {
    const { service, transaction } = createContext();

    const result = await service.validate(
      eventId,
      gateUserId,
      ticket.manualCode,
    );

    expect(result.result).toBe(TicketValidationResult.VALID);
    expect(transaction.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: ticket.id, eventId, status: TicketStatus.ACTIVE },
      data: { status: TicketStatus.USED, usedAt: result.ticket?.usedAt },
    });

    expect(transaction.ticketValidationLog.create).toHaveBeenCalledWith({
      data: {
        ticketId: ticket.id,
        eventId,
        gateUserId,
        result: TicketValidationResult.VALID,
        method: TicketValidationMethod.MANUAL,
        presentedCodeHash: createHash('sha256')
          .update(ticket.manualCode)
          .digest('hex'),
      },
    });
  });

  it('rejeita um QR com assinatura inválida sem consultar um ingresso', async () => {
    const { service, transaction, security } = createContext();
    security.verify.mockReturnValue(false);

    const result = await service.validate(eventId, gateUserId, 'qr-alterado');

    expect(result.result).toBe(TicketValidationResult.INVALID);
    expect(transaction.ticket.findUnique).not.toHaveBeenCalled();
    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  it('identifica um ingresso pertencente a outro evento', async () => {
    const { service, transaction } = createContext();
    transaction.ticket.findUnique.mockResolvedValue({
      ...ticket,
      eventId: otherEventId,
      event: { id: otherEventId, title: 'Outro evento' },
    });

    const result = await service.validate(
      eventId,
      gateUserId,
      ticket.manualCode,
    );

    expect(result.result).toBe(TicketValidationResult.WRONG_EVENT);
    expect(transaction.ticket.updateMany).not.toHaveBeenCalled();
  });

  it('trata a perda da disputa atômica como ingresso já utilizado', async () => {
    const { service, transaction } = createContext();
    transaction.ticket.updateMany.mockResolvedValue({ count: 0 });
    transaction.ticket.findUnique
      .mockResolvedValueOnce(ticket)
      .mockResolvedValueOnce({
        ...ticket,
        status: TicketStatus.USED,
        usedAt: new Date(),
      });

    const result = await service.validate(
      eventId,
      gateUserId,
      ticket.manualCode,
    );

    expect(result.result).toBe(TicketValidationResult.ALREADY_USED);
  });
});
