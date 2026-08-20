import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

@Injectable()
export class TicketSecurityService {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('TICKET_SIGNING_SECRET');
  }

  createTicketCode(): string {
    return randomBytes(24).toString('base64url');
  }

  createManualCode(): string {
    const value = randomBytes(9).toString('hex').toUpperCase().slice(0, 12);
    return `DT-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  }

  createShareToken(): string {
    return randomBytes(32).toString('base64url');
  }

  sign(ticketCode: string, eventId: string): string {
    const payload = `${ticketCode}.${eventId}`;
    const signature = this.createSignature(payload);
    return `${payload}.${signature}`;
  }

  verify(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [ticketCode, eventId, receivedSignature] = parts;
    if (!ticketCode || !eventId || !receivedSignature) return false;

    const expectedSignature = this.createSignature(`${ticketCode}.${eventId}`);
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);

    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  private createSignature(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }
}
