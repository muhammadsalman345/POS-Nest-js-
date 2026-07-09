import { RepairStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRepairDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  shopId: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  customerId: number;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) productId?: number;
  @IsOptional() @IsString() ticketNo?: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() imei1?: string;
  @IsOptional() @IsString() serialNumber?: string;

  @IsString()
  @IsNotEmpty()
  problemDescription: string;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) estimatedCost?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) finalCost?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) technicianId?: number;
  @IsOptional() @IsEnum(RepairStatus) status?: RepairStatus;
  @IsOptional() @IsDateString() expectedDeliveryDate?: string;
  @IsOptional() @IsString() notes?: string;
}
