// src/shops/dto/create-shop.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateShopDto {
  @IsNotEmpty()
  @IsString()
  shopName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
