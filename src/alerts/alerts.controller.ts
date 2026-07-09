import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { AlertsService } from './alerts.service';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.alerts.list(+shopId, user); }
  @Patch(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.alerts.read(+id, user); }
  @Patch('read-all')
  readAll(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.alerts.readAll(+shopId, user); }
}
