import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  productId?: number;

  @IsString()
  title: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}
