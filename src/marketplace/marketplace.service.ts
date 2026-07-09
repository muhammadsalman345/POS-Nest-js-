import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceStatus, Prisma, ProductStatus, SaleMode, ShopApprovalStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginated, pagination } from '../common/utils/pagination.util';
import { ProductFilterDto } from '../products/dto/product-filter.dto';
import { ProductsService } from '../products/products.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService, private readonly products: ProductsService) {}

  async shops(query: PaginationDto & { city?: string; area?: string }) {
    const { page, limit, skip, take } = pagination(query);
    const where = {
      deletedAt: null,
      isActive: true,
      approvalStatus: ShopApprovalStatus.APPROVED,
      ...(query.city ? { city: { contains: query.city } } : {}),
      ...(query.area ? { area: { contains: query.area } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({ where, skip, take, select: { id: true, name: true, address: true, city: true, area: true, phone: true, logo: true, description: true } }),
      this.prisma.shop.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async shop(id: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id, deletedAt: null, isActive: true, approvalStatus: ShopApprovalStatus.APPROVED },
      select: { id: true, name: true, address: true, city: true, area: true, phone: true, logo: true, description: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  productsList(query: ProductFilterDto & { city?: string; area?: string; shopId?: number }) {
    const where: Prisma.ProductWhereInput = {
      status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
      saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
      marketplaceStatus: MarketplaceStatus.PUBLISHED,
      shop: {
        isActive: true,
        approvalStatus: ShopApprovalStatus.APPROVED,
        ...(query.city ? { city: { contains: query.city } } : {}),
        ...(query.area ? { area: { contains: query.area } } : {}),
      },
      ...(query.shopId ? { shopId: Number(query.shopId) } : {}),
      ...this.products.filters(query),
    };
    return this.products.listByWhere(where, query);
  }

  async product(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
        saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
        marketplaceStatus: MarketplaceStatus.PUBLISHED,
        deletedAt: null,
        shop: { isActive: true, approvalStatus: ShopApprovalStatus.APPROVED },
      },
      include: { images: { where: { deletedAt: null } }, shop: { select: { id: true, name: true, city: true, area: true, phone: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
