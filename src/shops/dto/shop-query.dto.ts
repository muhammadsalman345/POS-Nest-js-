import { ShopStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ShopQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ShopStatus)
  status?: ShopStatus;
}
