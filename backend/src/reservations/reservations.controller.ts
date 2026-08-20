import {
  Body,
  Controller,
  Get,
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
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservas')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as reservas do cliente autenticado' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.listByCustomer(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Exibe uma reserva do cliente autenticado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findByCustomer(id, user.id);
  }

  @Post('events/:eventId')
  @ApiOperation({ summary: 'Reserva ingressos por 10 minutos' })
  @ApiConflictResponse({ description: 'Estoque insuficiente ou concorrência' })
  create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.id, eventId, input);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela uma reserva pendente e devolve o estoque' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.cancel(id, user.id);
  }
}
