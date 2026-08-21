import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventCategory } from '@prisma/client';
import { TicketmasterContentClient } from './ticketmaster-content.client';
import { TicketmasterClient } from './ticketmaster.client';

describe('TicketmasterClient', () => {
  const originalFetch = global.fetch;
  const contentClientMock = {
    findDescription: jest.fn(),
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    contentClientMock.findDescription.mockReset();
  });

  it('normaliza a resposta externa para o formato do DigiTicket', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        _embedded: {
          events: [
            {
              id: 'evento-externo-1',
              name: 'Festival Brasileiro',
              info: 'Descrição oficial do evento.',
              url: 'https://exemplo.com/evento',
              dates: { start: { dateTime: '2026-12-12T22:00:00Z' } },
              classifications: [{ primary: true, segment: { name: 'Music' } }],
              images: [
                {
                  url: 'https://exemplo.com/imagem.jpg',
                  ratio: '16_9',
                  width: 1024,
                },
              ],
              _embedded: {
                venues: [
                  {
                    name: 'Arena Demo',
                    address: { line1: 'Avenida Central, 100' },
                    city: { name: 'São Paulo' },
                    state: { stateCode: 'SP' },
                  },
                ],
              },
            },
          ],
        },
        page: { number: 0, totalPages: 1, totalElements: 1 },
      }),
    });
    global.fetch = fetchMock;
    const configService = {
      get: jest.fn().mockReturnValue('chave-de-teste'),
    } as unknown as ConfigService;
    const client = new TicketmasterClient(
      configService,
      contentClientMock as unknown as TicketmasterContentClient,
    );

    const result = await client.search({ keyword: 'festival', page: 0 });

    expect(result.events[0]).toMatchObject({
      id: 'evento-externo-1',
      title: 'Festival Brasileiro',
      category: EventCategory.SHOW,
      venueName: 'Arena Demo',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('countryCode=BR'),
      expect.any(Object),
    );
  });

  it('explica quando a chave da integração não foi configurada', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const client = new TicketmasterClient(
      configService,
      contentClientMock as unknown as TicketmasterContentClient,
    );

    await expect(
      client.search({ keyword: 'festival', page: 0 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('cria uma descrição completa quando a fonte não envia texto', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        id: 'evento-sem-descricao',
        name: 'Lagum | Brasília',
        dates: { start: { dateTime: '2026-11-07T22:00:00.000Z' } },
        classifications: [{ primary: true, segment: { name: 'Music' } }],
        _embedded: {
          venues: [
            {
              name: 'Arena Demo',
              city: { name: 'Brasília' },
              state: { stateCode: 'DF' },
            },
          ],
        },
      }),
    });
    global.fetch = fetchMock;
    const configService = {
      get: jest.fn().mockReturnValue('chave-de-teste'),
    } as unknown as ConfigService;
    const client = new TicketmasterClient(
      configService,
      contentClientMock as unknown as TicketmasterContentClient,
    );

    const event = await client.findOne('evento-sem-descricao');

    expect(event.description).toBe(
      'Lagum | Brasília é um show, programado para 7 de novembro de 2026 às 19:00, em Brasília/DF. A realização será no local Arena Demo.',
    );
  });

  it('prioriza o conteúdo editorial da Ticketmaster Brasil', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        id: 'evento-com-editorial',
        name: 'Lagum | Brasília',
        url: 'https://www.ticketmaster.com.br/event/venda-geral-lagum-brasilia',
        dates: { start: { dateTime: '2026-11-29T00:00:00.000Z' } },
        classifications: [{ primary: true, segment: { name: 'Music' } }],
        _embedded: {
          attractions: [{ name: 'Lagum' }],
          venues: [
            {
              name: 'Centro de Convenções',
              city: { name: 'Brasília' },
              state: { stateCode: 'DF' },
            },
          ],
        },
      }),
    });
    global.fetch = fetchMock;
    contentClientMock.findDescription.mockResolvedValue({
      description: 'Descrição editorial oficial sobre a turnê da banda.',
      sourceUrl: 'https://www.ticketmaster.com.br/event/lagum',
    });
    const configService = {
      get: jest.fn().mockReturnValue('chave-de-teste'),
    } as unknown as ConfigService;
    const client = new TicketmasterClient(
      configService,
      contentClientMock as unknown as TicketmasterContentClient,
    );

    const event = await client.findOne('evento-com-editorial');

    expect(event.description).toContain(
      'Descrição editorial oficial sobre a turnê da banda.',
    );
    expect(event.description).toContain(
      'Fonte: Ticketmaster Brasil (https://www.ticketmaster.com.br/event/lagum).',
    );
  });
});
