import { WarrantyClaimStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarrantyClaimDto {
  @IsString()
  @IsNotEmpty()
  issueDescription: string;

  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(WarrantyClaimStatus) status?: WarrantyClaimStatus;
}
