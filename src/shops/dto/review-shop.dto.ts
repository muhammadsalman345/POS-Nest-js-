import { ShopApprovalStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReviewShopDto {
  @IsEnum(ShopApprovalStatus)
  approvalStatus: ShopApprovalStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  paymentRequired?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined || value === '' ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
