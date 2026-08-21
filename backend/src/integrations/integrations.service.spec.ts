import { EventCategory } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { IntegrationsService } from './integrations.service';
import { TicketmasterClient } from './ticketmaster.client';

describe('IntegrationsService', () => {
  const externalEvent = {
    id: 'evento-externo-1',
    title: 'Festival Brasileiro',
    description: 'Descrição do festival.',
    category: EventCategory.SHOW,
    startDate: '2026-12-12T22:00:00.000Z',
    endDate: null,
    imageUrl: 'https://exemplo.com/imagem.jpg',
    sourceUrl: 'https://exemplo.com/evento',
    venueName: 'Arena Demo',
    address: 'Avenida Central, 100',
    city: 'São Paulo',
    state: 'SP',
  };
  const ticketmasterClientMock = {
    search: jest.fn(),
    findOne: jest.fn(),
  };
  const eventsServiceMock = {
    findImportedExternalIds: jest.fn(),
    createExternalDraft: jest.fn(),
  };
  let service: IntegrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntegrationsService(
      ticketmasterClientMock as unknown as TicketmasterClient,
      eventsServiceMock as unknown as EventsService,
    );
  });

  it('indica nos resultados quais eventos já foram importados', async () => {
    ticketmasterClientMock.search.mockResolvedValue({
      events: [externalEvent],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    eventsServiceMock.findImportedExternalIds.mockResolvedValue([
      externalEvent.id,
    ]);

    const result = await service.search({ keyword: 'festival', page: 0 });

    expect(result.events[0]).toMatchObject({
      alreadyImported: true,
      importable: true,
    });
  });

  it('cria um rascunho e assume três horas quando não há término', async () => {
    ticketmasterClientMock.findOne.mockResolvedValue(externalEvent);
    eventsServiceMock.createExternalDraft.mockResolvedValue({
      id: 'rascunho-1',
    });

    await service.importEvent(externalEvent.id, 'organizador-1');

    expect(eventsServiceMock.createExternalDraft).toHaveBeenCalledWith(
      'organizador-1',
      expect.objectContaining({
        externalSource: 'TICKETMASTER',
        externalId: externalEvent.id,
        startDate: new Date('2026-12-12T22:00:00.000Z'),
        endDate: new Date('2026-12-13T01:00:00.000Z'),
      }),
    );
  });
});
