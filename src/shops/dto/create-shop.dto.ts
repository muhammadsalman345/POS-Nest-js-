import { SaleMode, ShopStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  taxRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  openingTime?: string;

  @IsOptional()
  @IsString()
  closingTime?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  open24Hours?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @IsOptional()
  @IsString()
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  contactPersonDesignation?: string;

  @IsOptional()
  @IsString()
  contactPersonPhone?: string;

  @IsOptional()
  @IsEmail()
  contactPersonEmail?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inventoryTrackingEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  lowStockAlertsEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  allowNegativeStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlineSellingEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  cashOnDeliveryEnabled?: boolean;

  @IsOptional()
  @IsEnum(SaleMode)
  defaultSaleMode?: SaleMode;

  @IsOptional()
  @IsString()
  receiptSize?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
