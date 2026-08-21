import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { TicketTransfersService } from './ticket-transfers.service';

@ApiTags('transferências de ingressos')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('ticket-transfers')
export class TicketTransfersController {
  constructor(private readonly transfersService: TicketTransfersService) {}

  @Get('incoming')
  @ApiOperation({ summary: 'Lista transferências recebidas pelo cliente' })
  listIncoming(@CurrentUser() user: AuthenticatedUser) {
    return this.transfersService.listIncoming(user.id);
  }

  @Get('outgoing')
  @ApiOperation({ summary: 'Lista transferências enviadas pelo cliente' })
  listOutgoing(@CurrentUser() user: AuthenticatedUser) {
    return this.transfersService.listOutgoing(user.id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceita uma transferência recebida' })
  accept(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transfersService.accept(id, user.id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Recusa uma transferência recebida' })
  decline(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transfersService.decline(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancela uma transferência enviada' })
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transfersService.cancel(id, user.id);
  }
}
