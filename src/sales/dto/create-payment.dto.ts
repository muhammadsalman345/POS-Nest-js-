import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
