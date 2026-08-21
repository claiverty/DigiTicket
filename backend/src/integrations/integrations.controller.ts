import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SearchExternalEventsDto } from './dto/search-external-events.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrações externas')
@ApiBearerAuth()
@Roles(Role.ORGANIZER)
@Controller('integrations/ticketmaster/events')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Pesquisa eventos externos no Brasil' })
  search(@Query() query: SearchExternalEventsDto) {
    return this.integrationsService.search(query);
  }

  @Post(':externalId/import')
  @ApiOperation({ summary: 'Importa um evento externo como rascunho' })
  importEvent(
    @Param('externalId') externalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsService.importEvent(externalId, user.id);
  }
}
