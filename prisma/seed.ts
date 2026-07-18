import { PrismaClient } from '@prisma/client';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';

const prisma = new PrismaClient();

async function main() {
  await new SuperAdminSeeder(prisma).run();
  console.log('Seeded only the super admin account');
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
