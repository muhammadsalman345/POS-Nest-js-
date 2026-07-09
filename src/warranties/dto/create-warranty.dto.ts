import { WarrantyStatus, WarrantyType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateWarrantyDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  shopId: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) saleId?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) customerId?: number;

  @IsEnum(WarrantyType)
  warrantyType: WarrantyType;

  @IsDateString()
  startDate: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  warrantyMonths: number;

  @IsOptional() @IsString() invoiceNo?: string;
  @IsOptional() @IsString() terms?: string;
  @IsOptional() @IsEnum(WarrantyStatus) status?: WarrantyStatus;
}
