import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventCategory, EventSaleMode, EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const organizerId = 'd2f65ead-1d11-47fc-a8c9-bcd24f3b99cd';
  const eventId = '05ad3594-300c-4fba-ac11-a60dd0e75db4';
  const startDate = new Date('2026-12-12T22:00:00.000Z');
  const endDate = new Date('2026-12-13T01:00:00.000Z');
  const event = {
    id: eventId,
    organizerId,
    title: 'Festival Demo',
    slug: 'festival-demo',
    description: 'Descrição completa do evento de demonstração.',
    category: EventCategory.SHOW,
    saleMode: EventSaleMode.GENERAL_ADMISSION,
    venueName: 'Arena Demo',
    address: 'Avenida Central, 100',
    city: 'São Paulo',
    state: 'SP',
    startDate,
    endDate,
    posterUrl: null,
    status: EventStatus.DRAFT,
    externalSource: null,
    externalId: null,
    createdAt: startDate,
    updatedAt: startDate,
  };
  const eventMock = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prismaMock = { event: eventMock };
  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prismaMock as unknown as PrismaService);
  });

  it('mantém o catálogo restrito a eventos publicados', async () => {
    eventMock.findMany.mockResolvedValue([]);

    await service.listPublished({
      search: 'Festival',
      category: EventCategory.SHOW,
      city: 'São Paulo',
    });

    expect(eventMock.findMany).toHaveBeenCalledWith({
      where: {
        status: EventStatus.PUBLISHED,
        title: { contains: 'Festival', mode: 'insensitive' },
        category: EventCategory.SHOW,
        city: { contains: 'São Paulo', mode: 'insensitive' },
        startDate: undefined,
      },
      orderBy: { startDate: 'asc' },
      include: { organizer: { select: { name: true } } },
    });
  });

  it('cria evento sempre como rascunho e vinculado ao organizador', async () => {
    eventMock.findUnique.mockResolvedValue(null);
    eventMock.create.mockResolvedValue(event);

    await service.create(organizerId, {
      title: ' Festival Demo ',
      description: 'Descrição completa do evento de demonstração.',
      category: EventCategory.SHOW,
      saleMode: EventSaleMode.GENERAL_ADMISSION,
      venueName: 'Arena Demo',
      address: 'Avenida Central, 100',
      city: 'São Paulo',
      state: 'SP',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    expect(eventMock.create).toHaveBeenCalledWith({
      data: {
        organizerId,
        title: 'Festival Demo',
        slug: 'festival-demo',
        description: 'Descrição completa do evento de demonstração.',
        category: EventCategory.SHOW,
        saleMode: EventSaleMode.GENERAL_ADMISSION,
        venueName: 'Arena Demo',
        address: 'Avenida Central, 100',
        city: 'São Paulo',
        state: 'SP',
        startDate,
        endDate,
        posterUrl: null,
        status: EventStatus.DRAFT,
      },
    });
  });

  it('não revela nem altera evento pertencente a outro organizador', async () => {
    eventMock.findFirst.mockResolvedValue(null);

    await expect(
      service.update(eventId, organizerId, { title: 'Novo título' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(eventMock.update).not.toHaveBeenCalled();
  });

  it('preserva eventos publicados exigindo cancelamento em vez de exclusão', async () => {
    eventMock.findFirst.mockResolvedValue({
      ...event,
      status: EventStatus.PUBLISHED,
    });

    await expect(
      service.removeDraft(eventId, organizerId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(eventMock.delete).not.toHaveBeenCalled();
  });

  it('rejeita período cujo término não seja posterior ao início', async () => {
    eventMock.findUnique.mockResolvedValue(null);

    await expect(
      service.create(organizerId, {
        title: 'Evento inválido',
        description: 'Descrição completa do evento de demonstração.',
        category: EventCategory.OTHER,
        saleMode: EventSaleMode.GENERAL_ADMISSION,
        venueName: 'Local Demo',
        address: 'Avenida Central, 100',
        city: 'São Paulo',
        state: 'SP',
        startDate: startDate.toISOString(),
        endDate: startDate.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
