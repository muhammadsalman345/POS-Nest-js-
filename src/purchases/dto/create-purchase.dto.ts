import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateSellerDto } from '../../sellers/dto/create-seller.dto';
import { CreateProductDto } from '../../products/dto/create-product.dto';

export class PurchaseMetaDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsDateString()
  purchaseDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;
}

export class CreatePurchaseDto {
  @IsOptional()
  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : Number(value))
  @IsInt()
  @Min(1)
  sellerId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSellerDto)
  seller?: CreateSellerDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateProductDto)
  product: CreateProductDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PurchaseMetaDto)
  purchase: PurchaseMetaDto;
}
