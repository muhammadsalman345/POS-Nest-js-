import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class RootReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales')
  sales(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.monthlySales(+shopId, user); }
  @Get('purchases')
  purchases(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.dashboard(+shopId, user).then((data) => data.recentPurchases); }
  @Get('inventory')
  inventory(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.stockValue(+shopId, user); }
  @Get('profit-loss')
  profit(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.profitLoss(+shopId, user); }
  @Get('customers')
  customers(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.customers(+shopId, user); }
  @Get('suppliers')
  suppliers(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.suppliers(+shopId, user); }
  @Get('warranty')
  warranty(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.warranties(+shopId, user); }
  @Get('repairs')
  repairs(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.repairs(+shopId, user); }
  @Get('imei-history')
  imei(@Query('shop_id') shopId: string, @Query('imei') imei: string, @CurrentUser() user: AuthUser) { return this.reports.imeiHistory(+shopId, user, imei); }
  @Get('export/pdf')
  pdf(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.exportReport(+shopId, user, 'pdf'); }
  @Get('export/excel')
  excel(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser) { return this.reports.exportReport(+shopId, user, 'excel'); }
}
