import { UserRole } from '@prisma/client';

export type AuthUser = {
  id: number;
  phone: string;
  email?: string | null;
  role: UserRole;
};
