import { PaymentMethod, SaleType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';

export class CreateSaleDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : Number(value))
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

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
  notes?: string;
}
