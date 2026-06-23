import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureShopAccess(shopId: number, user: AuthUser) {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, deletedAt: null } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (user.role !== UserRole.SUPER_ADMIN && shop.ownerId !== user.id) throw new ForbiddenException('Forbidden shop access');
    return shop;
  }

  async ensureProductAccess(productId: number, user: AuthUser) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    await this.ensureShopAccess(product.shopId, user);
    return product;
  }
}
