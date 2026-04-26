import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shops/:shopId/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('dashboard')
  dashboard(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.dashboard(+shopId, user); }
  @Get('daily-sales')
  daily(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.dailySales(+shopId, user); }
  @Get('monthly-sales')
  monthly(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.monthlySales(+shopId, user); }
  @Get('profit-loss')
  profit(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.profitLoss(+shopId, user); }
  @Get('stock-value')
  stock(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.stockValue(+shopId, user); }
  @Get('sold-products')
  sold(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.soldProducts(+shopId, user); }
  @Get('seller-compliance')
  compliance(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.sellerCompliance(+shopId, user); }
  @Get('imei-history/:imei')
  imei(@Param('shopId') shopId: string, @Param('imei') imei: string, @CurrentUser() user: AuthUser) { return this.reports.imeiHistory(+shopId, user, imei); }
}
