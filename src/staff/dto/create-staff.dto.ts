import { StaffStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

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

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value.map(Number) : value === undefined ? undefined : [Number(value)]))
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds?: number[];
}
