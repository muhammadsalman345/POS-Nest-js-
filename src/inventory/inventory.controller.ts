import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ProductFilterDto } from '../products/dto/product-filter.dto';
import { UpdateProductStatusDto } from '../products/dto/update-status.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get('shops/:shopId/inventory')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ProductFilterDto) { return this.inventory.list(+shopId, user, query); }
  @Get('shops/:shopId/inventory/summary')
  summary(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser) { return this.inventory.summary(+shopId, user); }
  @Patch('inventory/products/:productId/status')
  status(@Param('productId') productId: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateProductStatusDto) { return this.inventory.updateStatus(+productId, user, dto); }
}
