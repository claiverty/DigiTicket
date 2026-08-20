import { ConfigService } from '@nestjs/config';
import { TicketSecurityService } from './ticket-security.service';

describe('TicketSecurityService', () => {
  const configService = {
    getOrThrow: jest
      .fn()
      .mockReturnValue('segredo-de-teste-com-mais-de-trinta-e-dois-caracteres'),
  } as unknown as ConfigService;
  const service = new TicketSecurityService(configService);

  it('assina e valida o token do QR Code', () => {
    const token = service.sign(
      'codigo-aleatorio',
      'ba223111-f633-40d5-b56f-a14427d38565',
    );

    expect(service.verify(token)).toBe(true);
    expect(service.verify(`${token}alterado`)).toBe(false);
  });

  it('gera identificadores aleatórios no formato esperado', () => {
    const firstTicketCode = service.createTicketCode();
    const secondTicketCode = service.createTicketCode();
    const manualCode = service.createManualCode();
    const shareToken = service.createShareToken();

    expect(firstTicketCode).not.toBe(secondTicketCode);
    expect(firstTicketCode.length).toBeGreaterThanOrEqual(30);
    expect(manualCode).toMatch(/^DT-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(shareToken.length).toBeGreaterThanOrEqual(40);
  });
});
