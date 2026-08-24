import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { OrganizerSalesController } from './organizer-sales.controller';
import { OrganizerSalesService } from './organizer-sales.service';

@Module({
  imports: [ReservationsModule],
  controllers: [OrganizerSalesController],
  providers: [OrganizerSalesService],
})
export class OrganizerSalesModule {}
