import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
