import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { TicketsService } from './tickets.service';

@ApiTags('ingressos')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os ingressos do cliente autenticado' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.listByCustomer(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Exibe um ingresso do cliente autenticado' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.findByCustomer(id, user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Gera ou substitui o link compartilhável' })
  share(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.createShare(id, user.id);
  }

  @Delete(':id/share')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o link compartilhável do ingresso' })
  @ApiNoContentResponse({ description: 'Link revogado' })
  async revokeShare(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.ticketsService.revokeShare(id, user.id);
  }
}
