import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { OrganizerSalesService } from './organizer-sales.service';

@ApiTags('vendas do organizador')
@ApiBearerAuth()
@Roles(Role.ORGANIZER)
@Controller('organizer/sales')
export class OrganizerSalesController {
  constructor(private readonly organizerSalesService: OrganizerSalesService) {}

  @Get()
  @ApiOperation({
    summary: 'Exibe métricas e reservas dos eventos do organizador',
  })
  @ApiOkResponse({
    description: 'Resumo comercial, próximos eventos e reservas recentes',
  })
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.organizerSalesService.getOverview(user.id);
  }
}
