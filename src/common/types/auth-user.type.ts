import { UserRole, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: number;
  phone: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  tokenVersion: number;
};
