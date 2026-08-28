import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  @Get('shops/:shopId')
  shop(@Param('shopId') shopId: string) { return this.marketplace.shop(+shopId); }
  @Get('products')
  products(@Query() query: MarketplaceProductQueryDto) { return this.marketplace.productsList(query); }
  @Get('products/:id')
  product(@Param('id') id: string) { return this.marketplace.product(+id); }
  @Post('orders')
  order(@Body() dto: MarketplaceOrderDto) { return this.marketplace.order(dto); }
}
