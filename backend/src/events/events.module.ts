import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { OrganizerEventsController } from './organizer-events.controller';
import { PublicEventsController } from './public-events.controller';

@Module({
  controllers: [PublicEventsController, OrganizerEventsController],
  providers: [EventsService],
})
export class EventsModule {}
