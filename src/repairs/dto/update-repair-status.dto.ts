import { RepairStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRepairStatusDto {
  @IsEnum(RepairStatus)
  status: RepairStatus;
}
