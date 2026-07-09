import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ExpenseFilterDto extends PaginationDto {
  @IsOptional()
  productId?: number;

  @IsOptional()
  categoryId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
