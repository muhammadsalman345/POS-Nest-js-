import { PrismaClient } from '@prisma/client';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';

const prisma = new PrismaClient();

async function main() {
  const modules = [
    'reports',
    'shops',
    'products',
    'marketplace',
    'sales',
    'purchases',
    'users',
    'settings',
  ];
  const actions = ['view', 'create', 'edit', 'delete'];
  const permissionNames = modules.flatMap((module) =>
    actions.map((action) => `${module}.${action}`),
  );

  await new SuperAdminSeeder(prisma).run();

  const permissions = await Promise.all(
    permissionNames.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name.replace('.', ' ')} permission` },
      }),
    ),
  );

  const rolePermissions = {
    admin: permissions,
    staff: permissions.filter((permission) =>
      ['reports.view', 'products.view', 'sales.view', 'sales.create'].includes(
        permission.name,
      ),
    ),
  };

  for (const [roleName, rolePermissionList] of Object.entries(
    rolePermissions,
  )) {
    const role = await prisma.staffRole.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} shop role` },
    });

    await Promise.all(
      rolePermissionList.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        }),
      ),
    );
  }

  console.log(
    `Seeded ${permissions.length} permissions and default staff roles`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
