import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateTicketTransferDto } from './dto/create-ticket-transfer.dto';
import { TicketTransfersService } from './ticket-transfers.service';

@ApiTags('transferências de ingressos')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('tickets')
export class TicketTransferRequestController {
  constructor(private readonly transfersService: TicketTransfersService) {}

  @Post(':ticketId/transfers')
  @ApiOperation({ summary: 'Solicita a transferência de um ingresso próprio' })
  create(
    @Param('ticketId', new ParseUUIDPipe({ version: '4' })) ticketId: string,
    @Body() input: CreateTicketTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transfersService.create(
      ticketId,
      user.id,
      input.recipientEmail,
    );
  }
}
