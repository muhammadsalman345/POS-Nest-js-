import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class SuperAdminSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async run() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    const phone = process.env.SUPER_ADMIN_PHONE || '03000000000';
    const password = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD || 'Admin@123',
      10,
    );

    const admin = await this.prisma.user.upsert({
      where: { phone },
      update: {
        name: 'Super Admin',
        email,
        password,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        isActive: true,
      },
      create: {
        name: 'Super Admin',
        email,
        phone,
        password,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        isActive: true,
      },
    });

    console.log(`Seeded super admin: ${admin.email} / ${admin.phone}`);
    return admin;
  }
}
