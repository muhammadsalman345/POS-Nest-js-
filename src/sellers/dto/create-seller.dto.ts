import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateSellerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsString()
  @Length(15, 15)
  cnic: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  cnicFrontImage?: string;

  @IsOptional()
  @IsString()
  cnicBackImage?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
