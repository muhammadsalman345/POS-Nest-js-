import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post('shops/:shopId/products')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(+shopId, user, dto);
  }

  @Get('shops/:shopId/products')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ProductFilterDto) {
    return this.products.list(+shopId, user, query);
  }

  @Get('products/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.products.findOne(+id, user); }
  @Patch('products/:id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateProductDto) { return this.products.update(+id, user, dto); }
  @Delete('products/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.products.remove(+id, user); }
  @Post('products/:id/images')
  addImage(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ProductImageDto) { return this.products.addImage(+id, user, dto); }
  @Delete('products/:id/images/:imageId')
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string, @CurrentUser() user: AuthUser) { return this.products.deleteImage(+id, +imageId, user); }
  @Patch('products/:id/status')
  status(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateProductStatusDto) { return this.products.status(+id, user, dto); }
}
