import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateSeatReservationDto } from './dto/create-seat-reservation.dto';
import { CreateSeatSectionDto } from './dto/create-seat-section.dto';
import { UpdateSeatSectionDto } from './dto/update-seat-section.dto';
import { SeatingService } from './seating.service';

@ApiTags('mapa de assentos')
@Controller()
export class SeatingController {
  constructor(private readonly seatingService: SeatingService) {}

  @Public()
  @Get('events/:eventId/seats')
  @ApiOperation({ summary: 'Exibe o mapa público de assentos de um evento' })
  listPublic(@Param('eventId') eventId: string) {
    return this.seatingService.listPublic(eventId);
  }

  @Get('organizer/events/:eventId/seat-sections')
  @ApiBearerAuth()
  @Roles(Role.ORGANIZER)
  listByOrganizer(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seatingService.listByOrganizer(eventId, user.id);
  }

  @Post('organizer/events/:eventId/seat-sections')
  @ApiBearerAuth()
  @Roles(Role.ORGANIZER)
  createSection(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateSeatSectionDto,
  ) {
    return this.seatingService.createSection(eventId, user.id, input);
  }

  @Delete('organizer/events/:eventId/seat-sections/:ticketTypeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Roles(Role.ORGANIZER)
  async removeSection(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.seatingService.removeSection(eventId, ticketTypeId, user.id);
  }

  @Patch('organizer/events/:eventId/seat-sections/:ticketTypeId')
  @ApiBearerAuth()
  @Roles(Role.ORGANIZER)
  updateSection(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateSeatSectionDto,
  ) {
    return this.seatingService.updateSection(
      eventId,
      ticketTypeId,
      user.id,
      input,
    );
  }

  @Post('reservations/events/:eventId/seats')
  @ApiBearerAuth()
  @Roles(Role.CUSTOMER)
  createReservation(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateSeatReservationDto,
  ) {
    return this.seatingService.createReservation(user.id, eventId, input);
  }
}
