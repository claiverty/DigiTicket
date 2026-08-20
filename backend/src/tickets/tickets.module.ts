import { Module } from '@nestjs/common';
import { SharedTicketsController } from './shared-tickets.controller';
import { TicketSecurityService } from './ticket-security.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController, SharedTicketsController],
  providers: [TicketsService, TicketSecurityService],
  exports: [TicketSecurityService],
})
export class TicketsModule {}
