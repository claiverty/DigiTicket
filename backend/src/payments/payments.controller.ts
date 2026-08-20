import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('pagamentos')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('reservations/:reservationId/simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula aprovação ou recusa sem realizar cobrança real',
  })
  @ApiConflictResponse({
    description: 'Reserva expirada, já processada ou com total inconsistente',
  })
  simulate(
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SimulatePaymentDto,
  ) {
    return this.paymentsService.simulate(reservationId, user.id, input.outcome);
  }
}
