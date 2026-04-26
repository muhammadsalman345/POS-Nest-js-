import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { SellersService } from './sellers.service';

@ApiTags('Sellers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SellersController {
  constructor(private readonly sellers: SellersService) {}

  @Post('shops/:shopId/sellers')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSellerDto) {
    return this.sellers.create(+shopId, user, dto);
  }

  @Get('shops/:shopId/sellers')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) {
    return this.sellers.list(+shopId, user, query);
  }

  @Get('sellers/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.sellers.findOne(+id, user);
  }

  @Patch('sellers/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateSellerDto) {
    return this.sellers.update(+id, user, dto);
  }

  @Delete('sellers/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.sellers.remove(+id, user);
  }

  @Get('sellers/:id/purchases')
  purchases(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.sellers.purchases(+id, user);
  }
}
