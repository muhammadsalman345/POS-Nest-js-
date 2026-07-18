import { MarketplaceStatus, ProductCondition, ProductSourceType, ProductStatus, PtaStatus, SaleMode, WarrantyType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ProductImageDto } from './product-image.dto';

export class CreateProductDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  sellerId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  sourceId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional() @IsString() variant?: string;
  @IsOptional() @IsString() imei1?: string;
  @IsOptional() @IsString() imei2?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() storage?: string;
  @IsOptional() @IsString() ram?: string;
  @IsOptional() @IsString() color?: string;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealth?: number;

  @IsOptional() @IsString() accessories?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  expectedSalePrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minimumSalePrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  soldQuantity?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsEnum(WarrantyType)
  warrantyType?: WarrantyType;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlineSaleEnabled?: boolean;

  @IsOptional()
  @IsEnum(ProductSourceType)
  sourceType?: ProductSourceType;

  @IsOptional()
  @IsEnum(SaleMode)
  saleMode?: SaleMode;

  @IsOptional()
  @IsEnum(MarketplaceStatus)
  marketplaceStatus?: MarketplaceStatus;

  @IsOptional() @IsString() sourceName?: string;
  @IsOptional() @IsString() sourcePhone?: string;
  @IsOptional() @IsString() sourceCnic?: string;
  @IsOptional() @IsString() sourceAddress?: string;
  @IsOptional() @IsString() supplierBusinessName?: string;
  @IsOptional() @IsString() supplierContactPerson?: string;
  @IsOptional() @IsString() supplierPhone?: string;
  @IsOptional() @IsString() supplierAddress?: string;

  @IsOptional()
  @IsEnum(PtaStatus)
  ptaStatus?: PtaStatus;

  @IsOptional() @IsString() description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsDateString()
  purchaseDate: string;
}
