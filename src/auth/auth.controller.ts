// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const user = await this.authService.signup(signupDto);
    const { password, ...result } = user;
    return result;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signinDto: SigninDto) {
    return this.authService.signIn(signinDto); // AuthService se redirectPath bhi ayega
  }
}