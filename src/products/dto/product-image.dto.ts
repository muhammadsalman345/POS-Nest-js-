import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
