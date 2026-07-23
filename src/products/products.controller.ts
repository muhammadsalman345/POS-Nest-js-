import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { productImageUploadOptions } from './product-image-upload';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post('products')
  createRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(+shopId, user, dto);
  }

  @Get('products')
  listRoot(@Query('shop_id') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ProductFilterDto) {
    const parsedShopId = Number(shopId);

    if (Number.isInteger(parsedShopId) && parsedShopId > 0) {
      return this.products.list(parsedShopId, user, query);
    }

    return this.products.listMine(user, query);
  }

  @Post('shops/:shopId/products')
  create(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.products.create(+shopId, user, dto);
  }

  @Get('shops/:shopId/products')
  list(@Param('shopId') shopId: string, @CurrentUser() user: AuthUser, @Query() query: ProductFilterDto) {
    return this.products.list(+shopId, user, query);
  }

  @Get('products/search')
  searchByImei(@Query('imei') imei: string, @CurrentUser() user: AuthUser) { return this.products.searchByImei(imei, user); }
  @Get('products/barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string, @CurrentUser() user: AuthUser) { return this.products.findByBarcode(barcode, user); }
  @Post('products/images')
  @UseInterceptors(FileInterceptor('image', productImageUploadOptions))
  uploadImage(@UploadedFile() file: Express.Multer.File) { return this.products.uploadedImage(file); }
  @Delete('products/images')
  deleteUploadedImage(@Query('path') path: string) { return this.products.deleteUploadedImage(path); }
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
  @Post('products/:id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.products.publish(+id, user); }
  @Post('products/:id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.products.unpublish(+id, user); }
  @Get('products/:id/barcode-label-pdf')
  barcodeLabel(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.products.barcodeLabel(+id, user); }
}
