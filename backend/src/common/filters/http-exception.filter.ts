import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ExceptionPayload {
  error?: string;
  message?: string | string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = this.readPayload(exception);

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error('Erro inesperado durante a requisição.', stack);
    }

    response.status(status).json({
      statusCode: status,
      error: payload.error ?? this.defaultError(status),
      message: payload.message ?? 'Ocorreu um erro interno no servidor.',
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private readPayload(exception: unknown): ExceptionPayload {
    if (!(exception instanceof HttpException)) return {};
    const response = exception.getResponse();

    if (typeof response === 'string') return { message: response };
    if (typeof response !== 'object' || response === null) return {};
    const error = 'error' in response ? response.error : undefined;
    const message = 'message' in response ? response.message : undefined;
    const validMessage =
      typeof message === 'string' ||
      (Array.isArray(message) &&
        message.every((item: unknown) => typeof item === 'string'));

    return {
      error: typeof error === 'string' ? error : undefined,
      message: validMessage ? message : undefined,
    };
  }

  private defaultError(status: number): string {
    const name = HttpStatus[status];
    if (!name) return 'Error';

    return name
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
