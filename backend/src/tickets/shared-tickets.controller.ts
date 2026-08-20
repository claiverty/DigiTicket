import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { TicketsService } from './tickets.service';

@Public()
@ApiTags('ingressos compartilhados')
@Controller('tickets/shared')
export class SharedTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':shareToken')
  @ApiOperation({ summary: 'Exibe um ingresso por link compartilhável' })
  @ApiNotFoundResponse({ description: 'Link inválido ou revogado' })
  findOne(@Param('shareToken') shareToken: string) {
    return this.ticketsService.findShared(shareToken);
  }
}
