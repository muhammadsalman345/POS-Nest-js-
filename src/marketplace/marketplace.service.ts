import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AlertType,
  MarketplaceStatus,
  Prisma,
  ProductStatus,
  SaleMode,
  ShopApprovalStatus,
  ShopStatus,
} from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { paginated, pagination } from '../common/utils/pagination.util';
import { ProductsService } from '../products/products.service';
import { productCollection } from '../products/resources/product.resource';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceOrderDto } from './dto/marketplace-order.dto';
import { MarketplaceProductQueryDto } from './dto/marketplace-product-query.dto';
import { MarketplaceShopQueryDto } from './dto/marketplace-shop-query.dto';

interface GeoQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly config: ConfigService,
    private readonly ownership: OwnershipService,
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

  async shopOrders(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const [items, total] = await Promise.all([
      (this.prisma as any).marketplaceOrder.findMany({
        where: { shopId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      (this.prisma as any).marketplaceOrder.count({ where: { shopId } }),
    ]);

    return paginated(items.map((order: any) => this.marketplaceOrderResource(order)), total, page, limit);
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

  async order(dto: MarketplaceOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one product is required');
    }

    if (!dto.customer?.name?.trim() || !dto.customer?.phone?.trim() || !dto.customer?.address?.trim()) {
      throw new BadRequestException('Customer name, phone, and delivery address are required');
    }

    const requestedItems = this.compactOrderItems(dto);
    const productIds = requestedItems.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] },
        saleMode: { in: [SaleMode.ONLINE_MARKETPLACE, SaleMode.BOTH] },
        marketplaceStatus: MarketplaceStatus.PUBLISHED,
      },
      include: {
        shop: {
          include: {
            owner: { select: { email: true, name: true, phone: true } },
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products are no longer available');
    }

    const shopIds = [...new Set(products.map((product) => product.shopId))];
    if (shopIds.length !== 1) {
      throw new BadRequestException('Checkout supports one shop per COD order');
    }

    const shop = products[0].shop;
    if (
      !shop ||
      !shop.isActive ||
      shop.status !== ShopStatus.ACTIVE ||
      shop.approvalStatus !== ShopApprovalStatus.APPROVED ||
      !shop.onlineSellingEnabled
    ) {
      throw new BadRequestException('Shop is not available for marketplace orders');
    }

    if (!shop.cashOnDeliveryEnabled) {
      throw new BadRequestException('Cash on delivery is not enabled for this shop');
    }

    const orderItems = requestedItems.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (Number(product.availableQuantity) < item.quantity) {
        throw new BadRequestException(`${product.name || product.brand} has insufficient stock`);
      }
      const unitPrice = this.productOrderPrice(product);
      if (unitPrice <= 0) {
        throw new BadRequestException(`${product.name || product.brand} does not have a valid sale price`);
      }
      return {
        item,
        product,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderNo = `MKT-ORDER-${shop.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const marketplaceOrder = await (tx as any).marketplaceOrder.create({
        data: {
          shopId: shop.id,
          orderNo,
          status: 'PENDING',
          paymentMethod: 'COD',
          customerName: dto.customer.name.trim(),
          customerPhone: dto.customer.phone.trim(),
          customerEmail: dto.customer.email?.trim().toLowerCase() || undefined,
          deliveryAddress: dto.customer.address.trim(),
          city: dto.customer.city?.trim(),
          country: dto.customer.country?.trim() || 'Pakistan',
          subtotal,
          totalAmount: subtotal,
          notes: dto.notes?.trim() || undefined,
          items: {
            create: orderItems.map(({ item, product, unitPrice, totalPrice }) => ({
              productId: product.id,
              productName: product.name || `${product.brand} ${product.model}`.trim(),
              sku: product.sku,
              quantity: item.quantity,
              unitPrice,
              totalPrice,
            })),
          },
        },
        include: {
          shop: {
            include: {
              owner: { select: { email: true, name: true, phone: true } },
            },
          },
          items: true,
        },
      });

      await tx.alert.create({
        data: {
          shopId: shop.id,
          type: AlertType.PENDING_DELIVERY,
          title: 'New marketplace COD order',
          message: `${dto.customer.name.trim()} requested ${orderItems.length} product(s) for ${subtotal} PKR.`,
          referenceType: 'MARKETPLACE_ORDER',
          referenceId: String(marketplaceOrder.id),
        },
      });

      return marketplaceOrder;
    });

    void this.sendMarketplaceOrderEmail(order).catch((error: unknown) => {
      this.logger.warn(
        `Marketplace order email failed for ${order.orderNo}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return this.marketplaceOrderResource(order);
  }

  private marketplaceOrderResource(order: any) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      invoiceNo: order.orderNo,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        address: order.deliveryAddress,
        city: order.city,
        country: order.country,
      },
      shop: order.shop
        ? {
            id: order.shop.id,
            name: order.shop.name,
            email: order.shop.email,
            phone: order.shop.phone,
          }
        : null,
      items: order.items,
      createdAt: order.createdAt,
    };
  }

  private async sendMarketplaceOrderEmail(order: any): Promise<void> {
    const recipients = [
      order.shop?.email,
      order.shop?.owner?.email,
    ].filter((email): email is string => Boolean(email));

    if (!recipients.length) {
      this.logger.warn(`Marketplace COD order ${order.orderNo} has no shop email recipient`);
      return;
    }

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from = this.config.get<string>('SMTP_FROM') || user;

    if (!host || !user || !pass || !from) {
      this.logger.warn(`SMTP is not configured. Marketplace COD order ${order.orderNo} should be sent to ${recipients.join(', ')}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: [...new Set(recipients)].join(','),
      subject: `New COD marketplace order ${order.orderNo}`,
      text: this.marketplaceOrderEmailText(order),
      html: this.marketplaceOrderEmailHtml(order),
    });
  }

  private marketplaceOrderEmailText(order: any): string {
    const items = (order.items || [])
      .map((item: any) => `- ${item.productName} x ${item.quantity}: ${item.totalPrice} PKR`)
      .join('\n');

    return [
      `New COD marketplace order: ${order.orderNo}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      order.customerEmail ? `Email: ${order.customerEmail}` : '',
      `Address: ${order.deliveryAddress}`,
      order.city ? `City: ${order.city}` : '',
      '',
      items,
      '',
      `Total: ${order.totalAmount} PKR`,
      order.notes ? `Note: ${order.notes}` : '',
      '',
      'This is an order request only. Create the actual sale/slip after delivery or hand-over.',
    ].filter(Boolean).join('\n');
  }

  private marketplaceOrderEmailHtml(order: any): string {
    const items = (order.items || [])
      .map((item: any) => `<li>${this.escapeHtml(item.productName)} x ${item.quantity}: ${item.totalPrice} PKR</li>`)
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; color: #172033;">
        <h2>New COD marketplace order</h2>
        <p><strong>${this.escapeHtml(order.orderNo)}</strong></p>
        <p>${this.escapeHtml(order.customerName)} | ${this.escapeHtml(order.customerPhone)}${order.customerEmail ? ` | ${this.escapeHtml(order.customerEmail)}` : ''}</p>
        <p>${this.escapeHtml(order.deliveryAddress)}${order.city ? `, ${this.escapeHtml(order.city)}` : ''}</p>
        <ul>${items}</ul>
        <p><strong>Total:</strong> ${order.totalAmount} PKR</p>
        ${order.notes ? `<p><strong>Note:</strong> ${this.escapeHtml(order.notes)}</p>` : ''}
        <p>This is an order request only. Create the actual sale/slip after delivery or hand-over.</p>
      </div>
    `;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  private compactOrderItems(dto: MarketplaceOrderDto): Array<{ productId: number; quantity: number }> {
    const itemMap = new Map<number, number>();
    for (const item of dto.items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity || 1);
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException('Invalid order item');
      }
      itemMap.set(productId, (itemMap.get(productId) ?? 0) + quantity);
    }

    return [...itemMap.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  }

  private productOrderPrice(product: {
    salePrice?: unknown;
    minimumSalePrice?: unknown;
    purchasePrice?: unknown;
  }): number {
    return this.numberOrZero(product.salePrice ?? product.minimumSalePrice ?? product.purchasePrice);
  }

  private numberOrZero(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
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
