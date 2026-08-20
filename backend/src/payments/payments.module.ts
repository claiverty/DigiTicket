import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentSimulatorService } from './payment-simulator.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ReservationsModule, TicketsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentSimulatorService],
})
export class PaymentsModule {}
