import { PrismaClient } from '@prisma/client';

export const ACCESS_MODULES = [
  'pos',
  'inventory',
  'sales',
  'reports',
  'customers',
  'products',
  'purchases',
  'shops',
  'marketplace',
  'users',
  'settings',
  'expenses',
  'warranties',
  'repairs',
] as const;

export const ACCESS_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

const rolePermissions: Record<string, string[]> = {
  Cashier: [
    'pos.view',
    'pos.create',
    'sales.view',
    'sales.create',
    'customers.view',
    'customers.create',
    'products.view',
    'inventory.view',
  ],
  'Inventory Manager': [
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'products.view',
    'products.create',
    'products.edit',
    'purchases.view',
    'purchases.create',
    'purchases.edit',
    'reports.view',
  ],
  Manager: ACCESS_MODULES.flatMap((module) =>
    ACCESS_ACTIONS.map((action) => `${module}.${action}`),
  ),
};

export const defaultPermissionNames = ACCESS_MODULES.flatMap((module) =>
  ACCESS_ACTIONS.map((action) => `${module}.${action}`),
);

export async function ensureDefaultAccessControl(prisma: PrismaClient) {
  const permissions = await Promise.all(
    defaultPermissionNames.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: readablePermission(name),
        },
      }),
    ),
  );
  const permissionByName = new Map(
    permissions.map((permission) => [permission.name, permission]),
  );

  for (const [name, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.staffRole.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} default module access`,
      },
    });

    await Promise.all(
      permissionNames.map((permissionName) => {
        const permission = permissionByName.get(permissionName);
        if (!permission) return Promise.resolve();
        return prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }),
    );
  }

  return permissions;
}

function readablePermission(name: string) {
  const [module, action] = name.split('.');
  return `${title(action)} ${title(module)} module`;
}

function title(value = '') {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
