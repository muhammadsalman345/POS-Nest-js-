import { DiscountType, PaymentMethod, SaleType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';

export class SaleItemDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity = 1;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class CreateSaleDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : Number(value))
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(SaleType)
  saleType?: SaleType;

  @IsOptional()
  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : Number(value))
  @IsInt()
  @Min(0)
  warrantyDays?: number;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items?: SaleItemDto[];

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsString()
  paymentReferenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
