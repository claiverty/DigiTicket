import { Module } from '@nestjs/common';
import { OrganizerTicketTypesController } from './organizer-ticket-types.controller';
import { TicketTypesService } from './ticket-types.service';

@Module({
  controllers: [OrganizerTicketTypesController],
  providers: [TicketTypesService],
})
export class TicketTypesModule {}
