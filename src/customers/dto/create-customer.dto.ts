import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  cnic?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
