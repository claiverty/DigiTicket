import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { EventsService } from './events.service';

@Public()
@ApiTags('eventos públicos')
@Controller('events')
export class PublicEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista somente eventos publicados' })
  @ApiOkResponse({ description: 'Catálogo ordenado pela data de início' })
  list(@Query() query: ListEventsQueryDto) {
    return this.eventsService.listPublished(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Exibe os detalhes de um evento publicado' })
  @ApiOkResponse({ description: 'Detalhes públicos do evento' })
  @ApiNotFoundResponse({ description: 'Evento publicado não encontrado' })
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findPublishedBySlug(slug);
  }
}
