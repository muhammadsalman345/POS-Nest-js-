// src/auth/interfaces/jwt-payload.interface.ts
import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
  userId:number;
  email: string;
  sub: number; // User ID
  role: Role;   // <--- Role shamil kiya
  isActive: boolean; // <--- isActive status shamil kiya
  iat?: number; // Issued At (Optional)
  exp?: number; // Expiration Time (Optional)
}