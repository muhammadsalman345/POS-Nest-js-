import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceStatus, Prisma, ProductStatus, SaleMode, ShopApprovalStatus, ShopStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginated, pagination } from '../common/utils/pagination.util';
import { ProductsService } from '../products/products.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceProductQueryDto } from './dto/marketplace-product-query.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService, private readonly products: ProductsService) {}

  async shops(query: PaginationDto & { city?: string; area?: string }) {
    const { page, limit, skip, take } = pagination(query);
    const where = {
      deletedAt: null,
      isActive: true,
      status: ShopStatus.ACTIVE,
      approvalStatus: ShopApprovalStatus.APPROVED,
      ...(query.city ? { city: { contains: query.city } } : {}),
      ...(query.area ? { area: { contains: query.area } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        select: { id: true, name: true, address: true, city: true, area: true, country: true, phone: true, logo: true, coverImage: true, description: true },
      }),
      this.prisma.shop.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async shop(id: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id, deletedAt: null, isActive: true, status: ShopStatus.ACTIVE, approvalStatus: ShopApprovalStatus.APPROVED },
      select: { id: true, name: true, address: true, city: true, area: true, country: true, phone: true, logo: true, coverImage: true, description: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  productsList(query: MarketplaceProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
      saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
      marketplaceStatus: MarketplaceStatus.PUBLISHED,
      shop: {
        isActive: true,
        status: ShopStatus.ACTIVE,
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
        shop: { isActive: true, status: ShopStatus.ACTIVE, approvalStatus: ShopApprovalStatus.APPROVED },
      },
      include: {
        images: { where: { deletedAt: null } },
        category: true,
        shop: { select: { id: true, name: true, address: true, city: true, area: true, country: true, phone: true, logo: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
