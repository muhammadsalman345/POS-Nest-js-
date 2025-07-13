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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<User> {
    const { email, password, firstName, lastName, phoneNumber } = signupDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
      role: Role.USER, // Default role
      firstName,
      lastName,
      phoneNumber,
      isActive: false, // New users are active by default
    });

    return this.usersRepository.save(newUser);
  }

  // <--- SIGN-IN METHOD MEIN AHEM TABDEELI --->
  async signIn(signinDto: SigninDto): Promise<{ accessToken: string, redirectPath: string }> { // Response type mein redirectPath shamil kiya
    const { email, password } = signinDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // New: Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive. Please contact support.');
    }

    // Payload for JWT (isme role aur isActive shamil kiya)
    const payload: JwtPayload = { email: user.email, sub: user.id, role: user.role, isActive: user.isActive };
    const accessToken = this.jwtService.sign(payload);

    // Frontend ko batane ke liye ke kahan redirect karna hai
    let redirectPath: string;
    if (user.role === Role.ADMIN) {
      redirectPath = '/admin/dashboard';
    } else if (user.role === Role.SUPPLIER) {
      redirectPath = '/supplier/dashboard';
    } else { // Default for USER role
      redirectPath = '/shop/dashboard'; // Assuming 'shop' module for regular users (POS users)
    }

    return {
      accessToken,
      redirectPath, // Frontend is path ko use karega
    };
  }
}