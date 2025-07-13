// src/auth/interfaces/jwt-payload.interface.ts (JWT Payload ke liye)

import { Role } from "src/common/enums/role.enum";




export interface JwtPayload {
  email: string;
  sub: number; // User ID
  role: Role;
  iat?: number; // Issued At (Optional, JWT standard)
  exp?: number; // Expiration Time (Optional, JWT standard)
}