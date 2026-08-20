import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { OrganizerEventsController } from './organizer-events.controller';
import { PublicEventsController } from './public-events.controller';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  controllers: [PublicEventsController, OrganizerEventsController],
  providers: [EventsService],
})
export class EventsModule {}
