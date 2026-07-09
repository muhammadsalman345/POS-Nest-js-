import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ImeiService } from './imei.service';

@ApiTags('IMEI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('imei')
export class ImeiController {
  constructor(private readonly imei: ImeiService) {}

  @Get(':imei/history')
  history(@Param('imei') imei: string, @CurrentUser() user: AuthUser) { return this.imei.history(imei, user); }
  @Get(':imei/current-status')
  currentStatus(@Param('imei') imei: string, @CurrentUser() user: AuthUser) { return this.imei.currentStatus(imei, user); }
}
