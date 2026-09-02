import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class MarketplaceOrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity = 1;
}

export class MarketplaceOrderCustomerDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class MarketplaceOrderDto {
  @ValidateNested()
  @Type(() => MarketplaceOrderCustomerDto)
  customer: MarketplaceOrderCustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarketplaceOrderItemDto)
  items: MarketplaceOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
