// dto/update-user-status.dto.ts

import { IsNumber } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNumber()
  userId: number;
}
