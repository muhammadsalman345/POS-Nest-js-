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
}
