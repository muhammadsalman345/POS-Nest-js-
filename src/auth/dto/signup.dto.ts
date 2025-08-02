import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { 
    message: 'Please provide a valid phone number with country code.' 
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}