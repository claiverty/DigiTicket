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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('eventos do organizador')
@ApiBearerAuth()
@Roles(Role.ORGANIZER)
@Controller('organizer/events')
export class OrganizerEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os eventos do organizador autenticado' })
  @ApiOkResponse({ description: 'Eventos próprios, incluindo rascunhos' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listByOrganizer(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Exibe um evento pertencente ao organizador' })
  @ApiNotFoundResponse({ description: 'Evento não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.findByOrganizer(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um evento em rascunho' })
  @ApiCreatedResponse({ description: 'Evento criado como DRAFT' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateEventDto,
  ) {
    return this.eventsService.create(user.id, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita um evento próprio não cancelado' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, input);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica um evento próprio' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.publish(id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela um evento próprio sem apagar o histórico' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.cancel(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui definitivamente apenas um rascunho próprio',
  })
  @ApiNoContentResponse({ description: 'Rascunho excluído' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.eventsService.removeDraft(id, user.id);
  }
}
