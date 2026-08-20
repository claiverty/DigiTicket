import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SimulatePaymentDto {
  @ApiProperty({
    enum: PaymentStatus,
    description: 'Resultado escolhido para o pagamento simulado.',
  })
  @IsEnum(PaymentStatus)
  outcome!: PaymentStatus;
}
