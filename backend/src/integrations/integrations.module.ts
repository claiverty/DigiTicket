import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { TicketmasterClient } from './ticketmaster.client';
import { TicketmasterContentClient } from './ticketmaster-content.client';

@Module({
  imports: [EventsModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    TicketmasterClient,
    TicketmasterContentClient,
  ],
})
export class IntegrationsModule {}
