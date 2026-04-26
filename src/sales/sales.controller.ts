import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SaleType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post('shops/:shopId/sales/offline')
  offline(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) { return this.sales.create(+shopId, user, dto, SaleType.OFFLINE); }
  @Post('shops/:shopId/sales/online')
  online(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) { return this.sales.create(+shopId, user, dto, SaleType.ONLINE); }
  @Get('shops/:shopId/sales')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.sales.list(+shopId, user, query); }
  @Get('sales/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.sales.findOne(+id, user); }
  @Patch('sales/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateSaleDto) { return this.sales.update(+id, user, dto); }
  @Delete('sales/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.sales.remove(+id, user); }
  @Get('sales/:id/invoice')
  invoice(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.sales.invoice(+id, user); }
}
