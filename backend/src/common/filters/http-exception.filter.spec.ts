import { BadRequestException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  function createHost() {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ originalUrl: '/api/teste' }),
      }),
    };
    return { host, response };
  }

  it('preserva mensagens de validação no formato padronizado', () => {
    const { host, response } = createHost();
    const filter = new HttpExceptionFilter();

    filter.catch(new BadRequestException(['campo inválido']), host as never);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['campo inválido'],
        path: '/api/teste',
      }),
    );
  });

  it('não envia detalhes internos de erros inesperados', () => {
    const { host, response } = createHost();
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new HttpExceptionFilter();

    filter.catch(new Error('senha-do-banco'), host as never);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Ocorreu um erro interno no servidor.',
      }),
    );
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(
      'senha-do-banco',
    );
    logger.mockRestore();
  });
});
