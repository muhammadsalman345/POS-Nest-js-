import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { MarketplaceOrderDto } from './dto/marketplace-order.dto';
import { MarketplaceProductQueryDto } from './dto/marketplace-product-query.dto';
import { MarketplaceShopQueryDto } from './dto/marketplace-shop-query.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}
  @Get('shops')
  shops(@Query() query: MarketplaceShopQueryDto) { return this.marketplace.shops(query); }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('shops/:shopId/orders')
  shopOrders(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: PaginationDto) {
    return this.marketplace.shopOrders(+shopId, user, query);
  }
  @Get('shops/:shopId')
  shop(@Param('shopId') shopId: string) { return this.marketplace.shop(+shopId); }
  @Get('products')
  products(@Query() query: MarketplaceProductQueryDto) { return this.marketplace.productsList(query); }
  @Get('products/:id')
  product(@Param('id') id: string) { return this.marketplace.product(+id); }
  @Post('orders')
  order(@Body() dto: MarketplaceOrderDto) { return this.marketplace.order(dto); }
}
