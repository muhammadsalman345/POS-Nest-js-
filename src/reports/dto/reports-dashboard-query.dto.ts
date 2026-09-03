import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Min } from 'class-validator';

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export class ReportsDashboardQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  shop_id?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  shopId?: number;

  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'all', 'custom'])
  period: ReportPeriod = 'month';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
