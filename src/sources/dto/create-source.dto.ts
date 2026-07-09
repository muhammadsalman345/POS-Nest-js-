import { RecordStatus, SourceType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSourceDto {
  @IsEnum(SourceType)
  type: SourceType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() fatherName?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() cnic?: string;
  @IsOptional() @IsString() cnicFrontImage?: string;
  @IsOptional() @IsString() cnicBackImage?: string;
  @IsOptional() @IsString() selfieImage?: string;
  @IsOptional() @IsString() address?: string;
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

  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(RecordStatus) status?: RecordStatus;
}
