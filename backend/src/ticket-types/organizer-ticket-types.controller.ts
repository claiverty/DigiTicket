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
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypesService } from './ticket-types.service';

@ApiTags('tipos de ingresso')
@ApiBearerAuth()
@Roles(Role.ORGANIZER)
@Controller('organizer/events/:eventId/ticket-types')
export class OrganizerTicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os tipos de ingresso de um evento próprio' })
  list(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypesService.list(eventId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um tipo de ingresso com estoque inicial' })
  create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.create(eventId, user.id, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita preço, descrição e capacidade com segurança',
  })
  update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.update(id, eventId, user.id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um tipo sem histórico de reservas' })
  @ApiNoContentResponse({ description: 'Tipo de ingresso excluído' })
  async remove(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.ticketTypesService.remove(id, eventId, user.id);
  }
}
