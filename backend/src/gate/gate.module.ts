import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { GateController } from './gate.controller';
import { GateService } from './gate.service';

@Module({
  imports: [TicketsModule],
  controllers: [GateController],
  providers: [GateService],
})
export class GateModule {}
