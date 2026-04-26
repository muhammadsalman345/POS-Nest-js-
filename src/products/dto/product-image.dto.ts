import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ProductImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
