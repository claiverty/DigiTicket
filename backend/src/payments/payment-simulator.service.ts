import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentSimulatorService {
  simulate(outcome: PaymentStatus): PaymentStatus {
    // O simulador recebe apenas um resultado de teste e nunca dados de cartão.
    return outcome;
  }
}
