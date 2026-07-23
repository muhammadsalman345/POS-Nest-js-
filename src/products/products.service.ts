import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ImeiEventType, MarketplaceStatus, Prisma, ProductStatus, SaleMode, ShopApprovalStatus, ShopStatus, UserRole } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { isInsideUploadsRoot, uploadedPublicPathToDiskPath } from '../common/utils/uploads.util';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productImagePath } from './product-image-upload';
import { productCollection, productResource } from './resources/product.resource';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateProductDto) {
    const shop = await this.ownership.ensureShopAccess(shopId, user);
    if (
      shop.approvalStatus !== ShopApprovalStatus.APPROVED ||
      shop.status !== ShopStatus.ACTIVE ||
      !shop.isActive
    ) {
      throw new BadRequestException('Shop must be approved and active before products can be added.');
    }
    await this.ensureUniqueSkuBarcode(dto.sku, dto.barcode);
    await this.ensureUniqueIdentifiers(dto.imei1, dto.imei2, dto.serialNumber);
    if (dto.sellerId) {
      const seller = await this.prisma.seller.findFirst({ where: { id: Number(dto.sellerId), shopId, deletedAt: null } });
      if (!seller) throw new NotFoundException('Seller not found in this shop');
    }
    if (dto.sourceId) {
      const source = await this.prisma.source.findFirst({ where: { id: Number(dto.sourceId), shopId, deletedAt: null } });
      if (!source) throw new NotFoundException('Source not found in this shop');
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: Number(dto.categoryId),
          deletedAt: null,
          OR: [{ shopId: null }, { shopId }],
        },
      });
      if (!category) throw new NotFoundException('Category not found');
    }
    if ((dto.images?.length ?? 0) > 5) {
      throw new BadRequestException('Maximum 5 product images are allowed');
    }
    const quantity = dto.quantity ?? 1;
    const soldQuantity = dto.soldQuantity ?? 0;
    const barcode = dto.barcode?.trim() || undefined;
    const name = dto.name?.trim() || [dto.brand, dto.model].filter(Boolean).join(' ').trim() || `Product ${Date.now()}`;
    const sku = dto.sku?.trim() || this.generateSku(shopId, name);
    const brand = dto.brand?.trim() || name;
    const model = dto.model?.trim() || name;
    const offlineSaleEnabled = dto.offlineSaleEnabled ?? true;
    const onlineSaleEnabled = dto.onlineSaleEnabled ?? false;
    const saleMode = dto.saleMode ?? this.saleMode(offlineSaleEnabled, onlineSaleEnabled);
    const { images, ...productData } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        sku,
        brand,
        model,
        sellerId: dto.sellerId ? Number(dto.sellerId) : undefined,
        categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
        sourceId: dto.sourceId ? Number(dto.sourceId) : undefined,
        name,
        shopId,
        barcode,
        qrCode: dto.qrCode || `product:${barcode ?? sku}`,
        quantity,
        soldQuantity,
        availableQuantity: Math.max(quantity - soldQuantity, 0),
        offlineSaleEnabled,
        onlineSaleEnabled,
        saleMode,
        marketplaceStatus: onlineSaleEnabled && dto.marketplaceStatus === MarketplaceStatus.PUBLISHED
          ? MarketplaceStatus.PUBLISHED
          : dto.marketplaceStatus ?? MarketplaceStatus.HIDDEN,
        createdById: user.id,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
        images: images?.length
          ? {
              create: images.map((image, index) => ({
                imageUrl: image.imageUrl || image.imagePath || '',
                imagePath: image.imagePath,
                isPrimary: image.isPrimary ?? index === 0,
                sortOrder: image.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: { images: true, seller: true, source: true, category: true },
    });
    await this.recordImeiHistory(product, ImeiEventType.PURCHASE, user.id, 'PRODUCT', product.id, undefined, String(product.status));
    await this.audit(user.id, 'CREATE', product.id, null, product);
    return productResource(product);
  }

  async list(shopId: number, user: AuthUser, query: ProductFilterDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.listByWhere({ shopId, ...this.filters(query) }, query);
  }

  async listMine(user: AuthUser, query: ProductFilterDto) {
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const ownerId = isAdmin && query.ownerId ? query.ownerId : user.id;
    return this.listByWhere({ shop: { ownerId }, ...this.filters(query) }, query);
  }

  async findOne(id: number, user: AuthUser) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: { images: { where: { deletedAt: null } }, seller: true, shop: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.ownership.ensureShopAccess(product.shopId, user);
    return productResource(product);
  }

  async update(id: number, user: AuthUser, dto: UpdateProductDto) {
    const old = await this.findOne(id, user);
    await this.ensureUniqueSkuBarcode(dto.sku, dto.barcode, id);
    if (dto.imei1 || dto.imei2 || dto.serialNumber) await this.ensureUniqueIdentifiers(dto.imei1, dto.imei2, dto.serialNumber, id);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: Number(dto.categoryId),
          deletedAt: null,
          OR: [{ shopId: null }, { shopId: old.shopId }],
        },
      });
      if (!category) throw new NotFoundException('Category not found');
    }
    const quantity = dto.quantity ?? old.quantity;
    const soldQuantity = dto.soldQuantity ?? old.soldQuantity;
    const { images, ...productData } = dto;
    const offlineSaleEnabled = dto.offlineSaleEnabled ?? old.offlineSaleEnabled ?? true;
    const onlineSaleEnabled = dto.onlineSaleEnabled ?? old.onlineSaleEnabled ?? false;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        sku: dto.sku?.trim(),
        name: dto.name?.trim(),
        brand: dto.brand?.trim() || (dto.name ? dto.name.trim() : undefined),
        model: dto.model?.trim() || (dto.name ? dto.name.trim() : undefined),
        barcode: dto.barcode?.trim() || (dto.barcode === '' ? null : undefined),
        sellerId: dto.sellerId ? Number(dto.sellerId) : undefined,
        categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
        sourceId: dto.sourceId ? Number(dto.sourceId) : undefined,
        availableQuantity: Math.max(quantity - soldQuantity, 0),
        offlineSaleEnabled,
        onlineSaleEnabled,
        saleMode: dto.saleMode ?? this.saleMode(offlineSaleEnabled, onlineSaleEnabled),
        marketplaceStatus: onlineSaleEnabled && dto.marketplaceStatus === MarketplaceStatus.PUBLISHED
          ? MarketplaceStatus.PUBLISHED
          : dto.marketplaceStatus ?? (onlineSaleEnabled ? old.marketplaceStatus : MarketplaceStatus.HIDDEN),
        updatedById: user.id,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
      include: { images: { where: { deletedAt: null } }, seller: true, source: true, category: true },
    });
    if (images) {
      await this.prisma.productImage.updateMany({ where: { productId: id, deletedAt: null }, data: { deletedAt: new Date() } });
      if (images.length) {
        await this.prisma.productImage.createMany({
          data: images.map((image, index) => ({
            productId: id,
            imageUrl: image.imageUrl || image.imagePath || '',
            imagePath: image.imagePath,
            isPrimary: image.isPrimary ?? index === 0,
            sortOrder: image.sortOrder ?? index,
          })),
        });
      }
    }
    await this.audit(user.id, 'UPDATE', id, old, product);
    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Product deleted' };
  }

  async addImage(id: number, user: AuthUser, dto: ProductImageDto) {
    await this.ownership.ensureProductAccess(id, user);
    const imageCount = await this.prisma.productImage.count({ where: { productId: id, deletedAt: null } });
    if (imageCount >= 5) {
      throw new BadRequestException('Maximum 5 product images are allowed');
    }
    if (dto.isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    }
    return this.prisma.productImage.create({ data: { productId: id, ...dto, imageUrl: dto.imageUrl || dto.imagePath || '' } });
  }

  async deleteImage(productId: number, imageId: number, user: AuthUser) {
    await this.ownership.ensureProductAccess(productId, user);
    const image = await this.prisma.productImage.update({ where: { id: imageId }, data: { deletedAt: new Date() } });
    this.deleteStoredProductImage(image.imagePath || image.imageUrl);
    return { message: 'Image deleted' };
  }

  uploadedImage(file: Express.Multer.File) {
    if (!file?.filename) {
      throw new BadRequestException('Image file is required.');
    }

    const path = productImagePath(file.filename);
    return {
      path,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  deleteUploadedImage(path: string) {
    if (!path) {
      throw new BadRequestException('Image path is required.');
    }

    if (!path.startsWith('/uploads/products/')) {
      throw new BadRequestException('Image path does not match product uploads.');
    }

    this.deleteStoredProductImage(path);
    return { message: 'Image deleted' };
  }

  async status(id: number, user: AuthUser, dto: UpdateProductStatusDto) {
    const old = await this.ownership.ensureProductAccess(id, user);
    const product = await this.prisma.product.update({ where: { id }, data: { status: dto.status } });
    await this.recordImeiHistory(product, ImeiEventType.STATUS_CHANGE, user.id, 'PRODUCT', product.id, String(old.status), String(product.status));
    await this.audit(user.id, 'STATUS_UPDATE', id, old, product);
    return productResource(product);
  }

  async searchByImei(imei: string, user: AuthUser) {
    const product = await this.prisma.product.findFirst({
      where: { deletedAt: null, OR: [{ imei1: imei }, { imei2: imei }, { serialNumber: imei }] },
      include: { shop: true, source: true, category: true, images: { where: { deletedAt: null } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.ownership.ensureShopAccess(product.shopId, user);
    return productResource(product);
  }

  async findByBarcode(barcode: string, user: AuthUser) {
    const product = await this.prisma.product.findFirst({ where: { barcode, deletedAt: null }, include: { shop: true, images: { where: { deletedAt: null } } } });
    if (!product) throw new NotFoundException('Product not found');
    await this.ownership.ensureShopAccess(product.shopId, user);
    return productResource(product);
  }

  async publish(id: number, user: AuthUser) {
    const product = await this.ownership.ensureProductAccess(id, user);
    if (product.status !== ProductStatus.IN_STOCK && product.status !== ProductStatus.AVAILABLE) {
      throw new BadRequestException('Only available products can be published');
    }
    return productResource(await this.prisma.product.update({
      where: { id },
      data: { saleMode: SaleMode.BOTH, onlineSaleEnabled: true, marketplaceStatus: MarketplaceStatus.PUBLISHED, updatedById: user.id },
    }));
  }

  async unpublish(id: number, user: AuthUser) {
    await this.ownership.ensureProductAccess(id, user);
    return productResource(await this.prisma.product.update({
      where: { id },
      data: { marketplaceStatus: MarketplaceStatus.HIDDEN, updatedById: user.id },
    }));
  }

  barcodeLabel(id: number, user: AuthUser) {
    return this.findOne(id, user);
  }

  async listByWhere(where: Prisma.ProductWhereInput, query: ProductFilterDto) {
    const { page, limit, skip, take } = pagination(query);
    const fullWhere = { deletedAt: null, ...where };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where: fullWhere, skip, take, include: { images: { where: { deletedAt: null } }, shop: true, category: true }, orderBy: { [this.safeSortBy(query.sortBy)]: query.sortOrder } }),
      this.prisma.product.count({ where: fullWhere }),
    ]);
    return paginated(productCollection(items), total, page, limit);
  }

  filters(query: ProductFilterDto): Prisma.ProductWhereInput {
    return {
      ...(query.brand ? { brand: { contains: query.brand } } : {}),
      ...(query.categoryId ? { categoryId: Number(query.categoryId) } : {}),
      ...(query.model ? { model: { contains: query.model } } : {}),
      ...(query.imei ? { OR: [{ imei1: { contains: query.imei } }, { imei2: { contains: query.imei } }, { serialNumber: { contains: query.imei } }] } : {}),
      ...(query.barcode ? { barcode: query.barcode } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.ptaStatus ? { ptaStatus: query.ptaStatus } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search } }, { brand: { contains: query.search } }, { model: { contains: query.search } }, { imei1: { contains: query.search } }, { imei2: { contains: query.search } }, { serialNumber: { contains: query.search } }, { barcode: { contains: query.search } }] } : {}),
      ...(query.minPrice || query.maxPrice ? { expectedSalePrice: { gte: query.minPrice, lte: query.maxPrice } } : {}),
    };
  }

  async ensureImeis(imei1?: string, imei2?: string, ignoreId?: number) {
    return this.ensureUniqueIdentifiers(imei1, imei2, undefined, ignoreId);
  }

  async ensureUniqueIdentifiers(imei1?: string, imei2?: string, serialNumber?: string, ignoreId?: number) {
    const checks = [imei1, imei2].filter(Boolean) as string[];
    if (!checks.length && !serialNumber) return;
    if (imei1 && imei2 && imei1 === imei2) throw new ConflictException('IMEI 1 and IMEI 2 must be different');
    const found = await this.prisma.product.findFirst({
      where: {
        id: ignoreId ? { not: ignoreId } : undefined,
        OR: [...checks.flatMap((imei) => [{ imei1: imei }, { imei2: imei }]), ...(serialNumber ? [{ serialNumber }] : [])],
      },
    });
    if (found) throw new ConflictException('IMEI or serial number already exists');
  }

  async ensureUniqueSkuBarcode(sku?: string, barcode?: string, ignoreId?: number) {
    const checks: Prisma.ProductWhereInput[] = [];

    if (sku?.trim()) checks.push({ sku: sku.trim() });
    if (barcode?.trim()) checks.push({ barcode: barcode.trim() });

    if (!checks.length) return;

    const found = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        id: ignoreId ? { not: ignoreId } : undefined,
        OR: checks,
      },
    });

    if (!found) return;

    if (sku?.trim() && found.sku === sku.trim()) {
      throw new ConflictException('SKU already exists');
    }

    if (barcode?.trim() && found.barcode === barcode.trim()) {
      throw new ConflictException('Barcode already exists');
    }
  }

  private saleMode(offlineSaleEnabled: boolean, onlineSaleEnabled: boolean): SaleMode {
    if (offlineSaleEnabled && onlineSaleEnabled) {
      return SaleMode.BOTH;
    }

    return onlineSaleEnabled ? SaleMode.ONLINE_MARKETPLACE : SaleMode.OFFLINE_ONLY;
  }

  private deleteStoredProductImage(path?: string | null) {
    if (!path?.startsWith('/uploads/products/')) {
      return;
    }

    const absolutePath = uploadedPublicPathToDiskPath(path);

    if (!isInsideUploadsRoot(absolutePath) || !existsSync(absolutePath)) {
      return;
    }

    unlinkSync(absolutePath);
  }

  private generateBarcode(shopId: number) {
    return `P${shopId}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private generateSku(shopId: number, name: string) {
    const body = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8) || 'ITEM';

    return `S${shopId}-${body}-${Date.now().toString().slice(-6)}`;
  }

  private safeSortBy(sortBy?: string): Prisma.ProductScalarFieldEnum {
    const allowed: Prisma.ProductScalarFieldEnum[] = ['createdAt', 'updatedAt', 'name', 'brand', 'model', 'purchasePrice', 'salePrice', 'quantity', 'availableQuantity', 'status'];
    return allowed.includes(sortBy as Prisma.ProductScalarFieldEnum)
      ? (sortBy as Prisma.ProductScalarFieldEnum)
      : 'createdAt';
  }

  private async recordImeiHistory(product: { id: number; shopId: number; imei1?: string | null; serialNumber?: string | null }, eventType: ImeiEventType, userId: number, referenceType: string, referenceId: number, previousStatus?: string, newStatus?: string) {
    const imei = product.imei1 || product.serialNumber;
    if (!imei) return;
    await this.prisma.imeiHistory.create({
      data: {
        shopId: product.shopId,
        productId: product.id,
        imei,
        serialNumber: product.serialNumber,
        eventType,
        referenceType,
        referenceId: String(referenceId),
        previousStatus,
        newStatus,
        createdById: userId,
      },
    });
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'PRODUCT', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
