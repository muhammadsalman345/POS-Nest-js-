import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MarketplaceStatus,
  Prisma,
  ProductStatus,
  SaleMode,
  ShopApprovalStatus,
  ShopStatus,
} from '@prisma/client';
import { paginated, pagination } from '../common/utils/pagination.util';
import { ProductsService } from '../products/products.service';
import { productCollection } from '../products/resources/product.resource';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceProductQueryDto } from './dto/marketplace-product-query.dto';
import { MarketplaceShopQueryDto } from './dto/marketplace-shop-query.dto';

interface GeoQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async shops(query: MarketplaceShopQueryDto) {
    const { page, limit, skip, take } = pagination(query);
    const geo = this.geoQuery(query);
    const search = query.search?.trim();
    const searchWhere: Prisma.ShopWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search } },
            { city: { contains: search } },
            { area: { contains: search } },
            { address: { contains: search } },
            { phone: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : undefined;
    const where: Prisma.ShopWhereInput = {
      deletedAt: null,
      isActive: true,
      status: ShopStatus.ACTIVE,
      approvalStatus: ShopApprovalStatus.APPROVED,
      ...(query.city ? { city: { contains: query.city } } : {}),
      ...(query.area ? { area: { contains: query.area } } : {}),
      ...(query.type ? { type: { contains: query.type } } : {}),
      ...(query.onlineSelling ? { onlineSellingEnabled: true } : {}),
      ...(query.cashOnDelivery ? { cashOnDeliveryEnabled: true } : {}),
      ...(query.hasImages ? { logo: { not: null }, coverImage: { not: null } } : {}),
      ...(geo ? this.shopBoundsWhere(geo) : {}),
      ...(searchWhere ? { AND: [searchWhere] } : {}),
    };

    if (geo) {
      const items = await this.prisma.shop.findMany({
        where,
        select: this.shopSelect(),
        orderBy: { [this.safeShopSortBy(query.sortBy)]: query.sortOrder },
      });
      const nearbyItems = items
        .map((shop) => this.withDistance(shop, geo))
        .filter((shop) => shop.distanceKm === undefined || shop.distanceKm <= geo.radiusKm)
        .sort((first, second) => (first.distanceKm ?? 9999) - (second.distanceKm ?? 9999));

      return paginated(nearbyItems.slice(skip, skip + take), nearbyItems.length, page, limit);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        select: this.shopSelect(),
        orderBy: { [this.safeShopSortBy(query.sortBy)]: query.sortOrder },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return paginated(items, total, page, limit);
  }

  async shop(id: number) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        id,
        deletedAt: null,
        isActive: true,
        status: ShopStatus.ACTIVE,
        approvalStatus: ShopApprovalStatus.APPROVED,
      },
      select: this.shopSelect(),
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async productsList(query: MarketplaceProductQueryDto) {
    const { page, limit, skip, take } = pagination(query);
    const geo = this.geoQuery(query);
    const productFilters = this.products.filters({
      ...query,
      minPrice: undefined,
      maxPrice: undefined,
    });
    const andFilters = [
      productFilters,
      ...this.marketplaceProductFilters(query),
    ].filter((filter) => Object.keys(filter).length);
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
      saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
      marketplaceStatus: MarketplaceStatus.PUBLISHED,
      shop: {
        isActive: true,
        status: ShopStatus.ACTIVE,
        approvalStatus: ShopApprovalStatus.APPROVED,
        ...(query.city ? { city: { contains: query.city } } : {}),
        ...(query.area ? { area: { contains: query.area } } : {}),
        ...(query.cashOnDelivery ? { cashOnDeliveryEnabled: true } : {}),
        ...(geo ? this.shopBoundsWhere(geo) : {}),
      },
      ...(query.shopId ? { shopId: Number(query.shopId) } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    };
    const items = await this.prisma.product.findMany({
      where,
      include: {
        images: { where: { deletedAt: null } },
        shop: true,
        category: { include: { parent: true } },
      },
      orderBy: { [this.safeProductSortBy(query.sortBy)]: query.sortOrder },
      ...(geo ? {} : { skip, take }),
    });

    if (!geo) {
      const total = await this.prisma.product.count({ where });
      return paginated(productCollection(items), total, page, limit);
    }

    const nearbyItems = items
      .map((product) => ({
        ...product,
        distanceKm: this.distanceFromShop(product.shop, geo),
      }))
      .filter((product) => product.distanceKm === undefined || product.distanceKm <= geo.radiusKm)
      .sort((first, second) => (first.distanceKm ?? 9999) - (second.distanceKm ?? 9999));
    const pageItems = nearbyItems.slice(skip, skip + take);
    const data = productCollection(pageItems).map((product, index) => ({
      ...product,
      distanceKm: pageItems[index]?.distanceKm,
    }));

    return paginated(data, nearbyItems.length, page, limit);
  }

  async product(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
        saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
        marketplaceStatus: MarketplaceStatus.PUBLISHED,
        deletedAt: null,
        shop: {
          isActive: true,
          status: ShopStatus.ACTIVE,
          approvalStatus: ShopApprovalStatus.APPROVED,
        },
      },
      include: {
        images: { where: { deletedAt: null } },
        category: { include: { parent: true } },
        shop: {
          select: this.shopSelect(),
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private geoQuery(query: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }): GeoQuery | undefined {
    if (
      !Number.isFinite(query.latitude) ||
      !Number.isFinite(query.longitude) ||
      !Number.isFinite(query.radiusKm)
    ) {
      return undefined;
    }

    return {
      latitude: Number(query.latitude),
      longitude: Number(query.longitude),
      radiusKm: Number(query.radiusKm),
    };
  }

  private shopBoundsWhere(geo: GeoQuery): Prisma.ShopWhereInput {
    const latitudeDelta = geo.radiusKm / 111.32;
    const longitudeDelta = geo.radiusKm / (111.32 * Math.cos((geo.latitude * Math.PI) / 180) || 1);

    return {
      latitude: { gte: geo.latitude - latitudeDelta, lte: geo.latitude + latitudeDelta },
      longitude: { gte: geo.longitude - longitudeDelta, lte: geo.longitude + longitudeDelta },
    };
  }

  private shopSelect() {
    return {
      id: true,
      name: true,
      address: true,
      city: true,
      area: true,
      country: true,
      phone: true,
      type: true,
      logo: true,
      coverImage: true,
      description: true,
      latitude: true,
      longitude: true,
      onlineSellingEnabled: true,
      cashOnDeliveryEnabled: true,
    } satisfies Prisma.ShopSelect;
  }

  private marketplaceProductFilters(query: MarketplaceProductQueryDto): Prisma.ProductWhereInput[] {
    const filters: Prisma.ProductWhereInput[] = [];

    if (query.category) {
      filters.push({
        category: {
          OR: [
            { name: { contains: query.category } },
            { parent: { name: { contains: query.category } } },
          ],
        },
      });
    }

    if (query.inStockOnly) {
      filters.push({ availableQuantity: { gt: 0 } });
    }

    if (query.hasImages) {
      filters.push({ images: { some: { deletedAt: null } } });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.push({
        OR: [
          { salePrice: this.priceRange(query) },
          { expectedSalePrice: this.priceRange(query) },
          { minimumSalePrice: this.priceRange(query) },
        ],
      });
    }

    return filters;
  }

  private priceRange(query: MarketplaceProductQueryDto) {
    return {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  private withDistance<T extends { latitude?: unknown; longitude?: unknown }>(
    item: T,
    geo: GeoQuery,
  ): T & { distanceKm?: number } {
    return {
      ...item,
      distanceKm: this.distanceKm(geo.latitude, geo.longitude, item.latitude, item.longitude),
    };
  }

  private distanceFromShop(
    shop: { latitude?: unknown; longitude?: unknown } | null,
    geo: GeoQuery,
  ): number | undefined {
    if (!shop) {
      return undefined;
    }

    return this.distanceKm(geo.latitude, geo.longitude, shop.latitude, shop.longitude);
  }

  private distanceKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitudeValue?: unknown,
    toLongitudeValue?: unknown,
  ): number | undefined {
    const toLatitude = Number(toLatitudeValue);
    const toLongitude = Number(toLongitudeValue);

    if (!Number.isFinite(toLatitude) || !Number.isFinite(toLongitude)) {
      return undefined;
    }

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const latitudeDelta = toRadians(toLatitude - fromLatitude);
    const longitudeDelta = toRadians(toLongitude - fromLongitude);
    const startLatitude = toRadians(fromLatitude);
    const endLatitude = toRadians(toLatitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(startLatitude) *
        Math.cos(endLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number(distance.toFixed(1));
  }

  private safeShopSortBy(sortBy?: string): Prisma.ShopScalarFieldEnum {
    const allowed: Prisma.ShopScalarFieldEnum[] = ['createdAt', 'updatedAt', 'name', 'city', 'status'];
    return allowed.includes(sortBy as Prisma.ShopScalarFieldEnum)
      ? (sortBy as Prisma.ShopScalarFieldEnum)
      : 'name';
  }

  private safeProductSortBy(sortBy?: string): Prisma.ProductScalarFieldEnum {
    const allowed: Prisma.ProductScalarFieldEnum[] = [
      'createdAt',
      'updatedAt',
      'name',
      'brand',
      'model',
      'purchasePrice',
      'salePrice',
      'quantity',
      'availableQuantity',
      'status',
    ];
    return allowed.includes(sortBy as Prisma.ProductScalarFieldEnum)
      ? (sortBy as Prisma.ProductScalarFieldEnum)
      : 'createdAt';
  }
}
