import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  shopId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  userId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  cnic?: string;

  @IsOptional() @IsString() cnicFrontImage?: string;
  @IsOptional() @IsString() cnicBackImage?: string;
  @IsOptional() @IsString() selfieImage?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() country?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  longitude?: number;

  @IsOptional() @IsString() notes?: string;
}
