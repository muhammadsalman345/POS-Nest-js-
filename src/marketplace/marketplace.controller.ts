import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MarketplaceProductQueryDto } from './dto/marketplace-product-query.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}
  @Get('shops')
  shops(@Query() query: PaginationDto & { city?: string; area?: string }) { return this.marketplace.shops(query); }
  @Get('shops/:shopId')
  shop(@Param('shopId') shopId: string) { return this.marketplace.shop(+shopId); }
  @Get('products')
  products(@Query() query: MarketplaceProductQueryDto) { return this.marketplace.productsList(query); }
  @Get('products/:id')
  product(@Param('id') id: string) { return this.marketplace.product(+id); }
}
