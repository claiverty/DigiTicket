import { TicketmasterContentClient } from './ticketmaster-content.client';

describe('TicketmasterContentClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('extrai texto editorial e ignora informações comerciais', async () => {
    const html = `
      <div class="block_content">
        <div>
          <p>Lagum apresenta uma nova turnê nacional que celebra a trajetória da banda brasileira.</p>
          <p>O grupo leva ao palco canções recentes e sucessos que marcaram seus anos de carreira.</p>
          <p>A pré-venda começa amanhã e a venda geral será realizada ao meio-dia nas bilheterias.</p>
        </div>
      </div>
    `;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(html),
    });
    const client = new TicketmasterContentClient();

    const result = await client.findDescription(
      'Lagum',
      'https://www.ticketmaster.com.br/event/venda-geral-lagum-brasilia',
    );

    expect(result).toEqual({
      description:
        'Lagum apresenta uma nova turnê nacional que celebra a trajetória da banda brasileira. O grupo leva ao palco canções recentes e sucessos que marcaram seus anos de carreira.',
      sourceUrl: 'https://www.ticketmaster.com.br/event/lagum',
    });
  });

  it('retorna vazio sem interromper a importação quando a página falha', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('indisponível'));
    const client = new TicketmasterContentClient();

    await expect(
      client.findDescription('Artista Demo', null),
    ).resolves.toBeNull();
  });
});
