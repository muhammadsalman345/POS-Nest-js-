// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // Import kiya

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SECRET_KEY', // TODO: Ye secret key .env se leni chahiye
    });
  }

  // <--- VALIDATE METHOD MEIN AHEM TABDEELI --->
  async validate(payload: JwtPayload) { // JwtPayload type use kiya
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    // TODO: JWT payload se `isActive` bhi check karein agar database se na ho raha ho
    // Agar JWT expired hai to Passport khud UnauthorizedException throw kar dega.

    // Return user object, which will be attached to the request (req.user)
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive // <--- isActive status bhi return kiya
    };
  }
}