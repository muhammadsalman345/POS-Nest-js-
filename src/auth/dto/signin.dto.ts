// src/auth/dto/signin.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class SigninDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  password: string;
}