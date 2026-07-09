import { RepairImageType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RepairImageDto {
  @IsString()
  @IsNotEmpty()
  imagePath: string;

  @IsOptional()
  @IsEnum(RepairImageType)
  type?: RepairImageType;
}
