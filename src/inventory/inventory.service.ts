import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductFilterDto } from '../products/dto/product-filter.dto';
import { UpdateProductStatusDto } from '../products/dto/update-status.dto';
import { ProductsService } from '../products/products.service';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService, private readonly products: ProductsService) {}

  async list(shopId: number, user: AuthUser, query: ProductFilterDto) {
    return this.products.list(shopId, user, query);
  }

  async summary(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const where = { shopId, deletedAt: null };
    const [totalProducts, statusCounts, purchaseAgg, expectedAgg] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({ by: ['status'], where, _count: { _all: true }, orderBy: { status: 'asc' } }),
      this.prisma.product.aggregate({ where, _sum: { purchasePrice: true } }),
      this.prisma.product.aggregate({ where: { ...where, status: ProductStatus.IN_STOCK }, _sum: { expectedSalePrice: true } }),
    ]);
    const count = (status: ProductStatus) => {
      const row = statusCounts.find((item) => item.status === status) as { _count?: { _all?: number } } | undefined;
      return row?._count?._all || 0;
    };
    return {
      totalProducts,
      inStock: count(ProductStatus.IN_STOCK),
      sold: count(ProductStatus.SOLD),
      reserved: count(ProductStatus.RESERVED),
      damaged: count(ProductStatus.DAMAGED),
      returned: count(ProductStatus.RETURNED),
      totalPurchaseValue: purchaseAgg._sum.purchasePrice || 0,
      totalExpectedSaleValue: expectedAgg._sum.expectedSalePrice || 0,
    };
  }

  updateStatus(productId: number, user: AuthUser, dto: UpdateProductStatusDto) {
    return this.products.status(productId, user, dto);
  }
}
