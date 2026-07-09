import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImeiService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async history(imei: string, user: AuthUser) {
    const events = await this.prisma.imeiHistory.findMany({
      where: { imei },
      include: { product: true, shop: true },
      orderBy: { createdAt: 'desc' },
    });
    const visible = [];
    for (const event of events) {
      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        visible.push(event);
        continue;
      }
      try {
        await this.ownership.ensureShopAccess(event.shopId, user);
        visible.push(event);
      } catch {
        // Hide data from shops the user cannot access.
      }
    }
    return visible;
  }

  async currentStatus(imei: string, user: AuthUser) {
    const product = await this.prisma.product.findFirst({
      where: { deletedAt: null, OR: [{ imei1: imei }, { imei2: imei }, { serialNumber: imei }] },
      include: { shop: true, saleItems: { include: { sale: true }, orderBy: { saleId: 'desc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('IMEI or serial number not found');
    await this.ownership.ensureShopAccess(product.shopId, user);
    return {
      productId: product.id,
      shopId: product.shopId,
      imei,
      serialNumber: product.serialNumber,
      status: product.status,
      availableQuantity: product.availableQuantity,
      lastSale: product.saleItems[0]?.sale || null,
    };
  }
}
