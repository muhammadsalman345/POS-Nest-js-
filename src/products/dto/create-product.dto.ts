import { ProductCondition, ProductSourceType, ProductStatus, PtaStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  sellerId: number;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional() @IsString() variant?: string;
  @IsString() @IsNotEmpty() imei1: string;
  @IsOptional() @IsString() imei2?: string;
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
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlineSaleEnabled?: boolean;

  @IsOptional()
  @IsEnum(ProductSourceType)
  sourceType?: ProductSourceType;

  @IsOptional() @IsString() sourceName?: string;
  @IsOptional() @IsString() sourcePhone?: string;
  @IsOptional() @IsString() sourceCnic?: string;
  @IsOptional() @IsString() sourceAddress?: string;
  @IsOptional() @IsString() supplierBusinessName?: string;
  @IsOptional() @IsString() supplierContactPerson?: string;
  @IsOptional() @IsString() supplierPhone?: string;
  @IsOptional() @IsString() supplierAddress?: string;

  @IsEnum(PtaStatus)
  ptaStatus: PtaStatus;

  @IsOptional() @IsString() description?: string;

  @IsDateString()
  purchaseDate: string;
}
