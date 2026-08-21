import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';

@Module({
  imports: [ReservationsModule],
  controllers: [SeatingController],
  providers: [SeatingService],
})
export class SeatingModule {}
