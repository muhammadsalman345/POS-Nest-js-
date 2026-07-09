import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  expenseCategoryId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}
