// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './interfaces/jwt-payload.interface'; // JwtPayload import kiya
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { ApiResponse } from 'src/common/dto/response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

async signup(signupDto: SignupDto): Promise<User> {
  const { email, password, firstName, lastName, phoneNumber,address } = signupDto;

  const existingUser = await this.usersRepository.findOne({ where: { email } });
  if (existingUser) {
    throw new BadRequestException('Email already registered.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = this.usersRepository.create({
    email,
    password: hashedPassword,
    role: Role.USER,
    firstName,
    lastName,
    address,
    phoneNumber,
    isActive: false,
    shops: [] // Explicitly set shops as empty array
  });

  return this.usersRepository.save(newUser);
}


 async signIn(signinDto: SigninDto): Promise<ApiResponse<any>> {
  const { email, password } = signinDto;

  const user = await this.usersRepository.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedException('Invalid credentials.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials.');
  }

  if (!user.isActive) {
    throw new UnauthorizedException('Your account is inactive. Please contact support.');
  }

  const payload: JwtPayload = {
    userId:user.id,
    email: user.email,
    sub: user.id,
    role: user.role,
    isActive: user.isActive,
  };

  const accessToken = this.jwtService.sign(payload);

  let redirectPath: string;
  switch (user.role) {
    case Role.ADMIN:
      redirectPath = '/dashboard';
      break;
    case Role.SUPPLIER:
      redirectPath = '/supplier/dashboard';
      break;
    default:
      redirectPath = '/shop/dashboard';
  }

  // return ApiResponse format
  return new ApiResponse(true, 'Login successful', {
    token: accessToken,
    redirectPath,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    },
  });
}

}