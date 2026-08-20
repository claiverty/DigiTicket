import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { GateService } from './gate.service';

@ApiTags('portaria')
@ApiBearerAuth()
@Roles(Role.GATE)
@Controller('gate')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get('events')
  @ApiOperation({ summary: 'Lista os eventos disponíveis para a portaria' })
  listEvents() {
    return this.gateService.listEvents();
  }

  @Get('events/:eventId/validations')
  @ApiOperation({ summary: 'Lista as validações recentes do evento' })
  listValidations(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.gateService.listValidations(eventId);
  }

  @Post('events/:eventId/validate')
  @ApiOperation({ summary: 'Valida e consome um ingresso de forma atômica' })
  validate(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Body() input: ValidateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.gateService.validate(eventId, user.id, input.code);
  }
}
