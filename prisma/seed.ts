import { PrismaClient } from '@prisma/client';
import { ensureDefaultAccessControl } from '../src/common/access-control/default-access-control';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';

const prisma = new PrismaClient();

async function main() {
  await ensureDefaultAccessControl(prisma);
  await new SuperAdminSeeder(prisma).run();
  console.log('Seeded access control and the super admin account');
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
