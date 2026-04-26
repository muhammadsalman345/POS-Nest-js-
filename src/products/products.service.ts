import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateProductDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    await this.ensureImeis(dto.imei1, dto.imei2);
    const seller = await this.prisma.seller.findFirst({ where: { id: Number(dto.sellerId), shopId, deletedAt: null } });
    if (!seller) throw new NotFoundException('Seller not found in this shop');
    const product = await this.prisma.product.create({
      data: { ...dto, sellerId: Number(dto.sellerId), shopId, purchaseDate: new Date(dto.purchaseDate) },
      include: { images: true, seller: true },
    });
    await this.audit(user.id, 'CREATE', product.id, null, product);
    return product;
  }

  async list(shopId: number, user: AuthUser, query: ProductFilterDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.listByWhere({ shopId, ...this.filters(query) }, query);
  }

  async findOne(id: number, user: AuthUser) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: { images: { where: { deletedAt: null } }, seller: true, shop: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.ownership.ensureShopAccess(product.shopId, user);
    return product;
  }

  async update(id: number, user: AuthUser, dto: UpdateProductDto) {
    const old = await this.findOne(id, user);
    if (dto.imei1 || dto.imei2) await this.ensureImeis(dto.imei1, dto.imei2, id);
    const product = await this.prisma.product.update({ where: { id }, data: { ...dto, purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined } });
    await this.audit(user.id, 'UPDATE', id, old, product);
    return product;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Product deleted' };
  }

  async addImage(id: number, user: AuthUser, dto: ProductImageDto) {
    await this.ownership.ensureProductAccess(id, user);
    if (dto.isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    }
    return this.prisma.productImage.create({ data: { productId: id, ...dto } });
  }

  async deleteImage(productId: number, imageId: number, user: AuthUser) {
    await this.ownership.ensureProductAccess(productId, user);
    await this.prisma.productImage.update({ where: { id: imageId }, data: { deletedAt: new Date() } });
    return { message: 'Image deleted' };
  }

  async status(id: number, user: AuthUser, dto: UpdateProductStatusDto) {
    const old = await this.ownership.ensureProductAccess(id, user);
    const product = await this.prisma.product.update({ where: { id }, data: { status: dto.status } });
    await this.audit(user.id, 'STATUS_UPDATE', id, old, product);
    return product;
  }

  async listByWhere(where: Prisma.ProductWhereInput, query: ProductFilterDto) {
    const { page, limit, skip, take } = pagination(query);
    const fullWhere = { deletedAt: null, ...where };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where: fullWhere, skip, take, include: { images: { where: { deletedAt: null } }, shop: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.product.count({ where: fullWhere }),
    ]);
    return paginated(items, total, page, limit);
  }

  filters(query: ProductFilterDto): Prisma.ProductWhereInput {
    return {
      ...(query.brand ? { brand: { contains: query.brand } } : {}),
      ...(query.model ? { model: { contains: query.model } } : {}),
      ...(query.imei ? { OR: [{ imei1: { contains: query.imei } }, { imei2: { contains: query.imei } }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.ptaStatus ? { ptaStatus: query.ptaStatus } : {}),
      ...(query.search ? { OR: [{ brand: { contains: query.search } }, { model: { contains: query.search } }, { imei1: { contains: query.search } }, { imei2: { contains: query.search } }] } : {}),
      ...(query.minPrice || query.maxPrice ? { expectedSalePrice: { gte: query.minPrice, lte: query.maxPrice } } : {}),
    };
  }

  async ensureImeis(imei1?: string, imei2?: string, ignoreId?: number) {
    const checks = [imei1, imei2].filter(Boolean) as string[];
    if (!checks.length) return;
    const found = await this.prisma.product.findFirst({
      where: { id: ignoreId ? { not: ignoreId } : undefined, OR: checks.flatMap((imei) => [{ imei1: imei }, { imei2: imei }]) },
    });
    if (found) throw new ConflictException('IMEI already exists');
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'PRODUCT', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
