import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  isAdmin(user: AuthUser) {
    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
  }

  async ensureShopAccess(shopId: number, user: AuthUser) {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, deletedAt: null } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (this.isAdmin(user) || shop.ownerId === user.id) return shop;
    const staff = await this.prisma.shopStaff.findFirst({
      where: { shopId, userId: user.id, status: 'ACTIVE' },
    });
    if (!staff) throw new ForbiddenException('Forbidden shop access');
    return shop;
  }

  async ensureProductAccess(productId: number, user: AuthUser) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    await this.ensureShopAccess(product.shopId, user);
    return product;
  }

  async ensureShopPermission(shopId: number, user: AuthUser, permissions: string | string[]) {
    const shop = await this.ensureShopAccess(shopId, user);
    if (this.isAdmin(user)) return shop;
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    if (shop.ownerId === user.id) {
      const ownerPermissions = await this.prisma.userPermission.findMany({
        where: { userId: user.id },
        include: { permission: true },
      });
      const ownerPermissionNames = ownerPermissions.map((item) => item.permission.name);
      if (!ownerPermissionNames.length || requiredPermissions.some((permission) => ownerPermissionNames.includes(permission))) return shop;
      throw new ForbiddenException('Forbidden module access');
    }

    const staff = await this.prisma.shopStaff.findFirst({
      where: { shopId, userId: user.id, status: 'ACTIVE' },
      include: {
        staffPermissions: { include: { permission: true } },
        role: { include: { rolePermissions: { include: { permission: true } } } },
      },
    });
    const staffPermissionNames = [
      ...(staff?.staffPermissions.map((item) => item.permission.name) ?? []),
      ...(staff?.role.rolePermissions.map((item) => item.permission.name) ?? []),
    ];
    if (requiredPermissions.some((permission) => staffPermissionNames.includes(permission))) return shop;
    throw new ForbiddenException('Forbidden module access');
  }
}
