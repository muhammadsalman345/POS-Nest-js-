import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MarketplaceShopQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlineSelling?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  cashOnDelivery?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasImages?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(250)
  radiusKm?: number;
}
