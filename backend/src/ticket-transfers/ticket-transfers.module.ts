import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { TicketTransferRequestController } from './ticket-transfer-request.controller';
import { TicketTransfersController } from './ticket-transfers.controller';
import { TicketTransfersService } from './ticket-transfers.service';

@Module({
  imports: [TicketsModule],
  controllers: [TicketTransferRequestController, TicketTransfersController],
  providers: [TicketTransfersService],
})
export class TicketTransfersModule {}
