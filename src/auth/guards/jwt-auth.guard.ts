// src/auth/guards/jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // <--- AHEM TABDEELI: isActive check yahan kiya --->
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed or token invalid.');
    }
    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive. Please contact support.');
    }
    return user;
  }
}