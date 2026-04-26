import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Post('shops/:shopId/purchases')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreatePurchaseDto) { return this.purchases.create(+shopId, user, dto); }
  @Get('shops/:shopId/purchases')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) { return this.purchases.list(+shopId, user, query); }
  @Get('purchases/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.purchases.findOne(+id, user); }
  @Patch('purchases/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePurchaseDto) { return this.purchases.update(+id, user, dto); }
  @Delete('purchases/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.purchases.remove(+id, user); }
  @Get('purchases/:id/receipt')
  receipt(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.purchases.receipt(+id, user); }
}
