import { StaffStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStaffDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  userId: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  roleId: number;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}
