import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ImeiEventType } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly products: ProductsService,
  ) {}

  async create(shopId: number, user: AuthUser, dto: CreatePurchaseDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    if (!dto.sellerId && !dto.seller && !dto.sourceId) throw new BadRequestException('sellerId, seller, or sourceId is required');
    await this.products.ensureImeis(dto.product.imei1, dto.product.imei2);

    return this.prisma.$transaction(async (tx) => {
      const seller = dto.sellerId
        ? await tx.seller.findFirst({ where: { id: Number(dto.sellerId), shopId, deletedAt: null } })
        : dto.seller
          ? await tx.seller.create({ data: { ...dto.seller, shopId } })
          : null;
      if ((dto.sellerId || dto.seller) && !seller) throw new NotFoundException('Seller not found in this shop');
      const source = dto.sourceId ? await tx.source.findFirst({ where: { id: Number(dto.sourceId), shopId, deletedAt: null } }) : null;
      if (dto.sourceId && !source) throw new NotFoundException('Source not found in this shop');
      const product = await tx.product.create({
        data: {
          ...dto.product,
          shopId,
          sellerId: seller?.id,
          sourceId: source?.id,
          name: dto.product.name || `${dto.product.brand} ${dto.product.model}`.trim(),
          quantity: dto.product.quantity || 1,
          soldQuantity: 0,
          availableQuantity: dto.product.quantity || 1,
          barcode: dto.product.barcode || `P${shopId}${Date.now()}`,
          qrCode: dto.product.qrCode || `purchase:${shopId}:${Date.now()}`,
          purchasePrice: dto.purchase.purchasePrice,
          purchaseDate: new Date(dto.purchase.purchaseDate),
          createdById: user.id,
        },
      });
      const purchase = await tx.purchase.create({
        data: {
          shopId,
          sellerId: seller?.id,
          sourceId: source?.id,
          productId: product.id,
          purchasePrice: dto.purchase.purchasePrice,
          purchaseDate: new Date(dto.purchase.purchaseDate),
          notes: dto.purchase.notes,
          receiptNumber: dto.purchase.receiptNumber || `PUR-${Date.now()}`,
          createdById: user.id,
        },
        include: { seller: true, source: true, product: true, shop: true },
      });
      const imei = product.imei1 || product.serialNumber;
      if (imei) {
        await tx.imeiHistory.create({
          data: { shopId, productId: product.id, imei, serialNumber: product.serialNumber, eventType: ImeiEventType.PURCHASE, referenceType: 'PURCHASE', referenceId: String(purchase.id), newStatus: String(product.status), createdById: user.id },
        });
      }
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', module: 'PURCHASE', recordId: String(purchase.id), newData: serializeAuditData(purchase) } });
      return purchase;
    });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where = { shopId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({ where, skip, take, include: { seller: true, source: true, product: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.purchase.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const purchase = await this.prisma.purchase.findFirst({ where: { id, deletedAt: null }, include: { shop: true, seller: true, source: true, product: true } });
    if (!purchase) throw new NotFoundException('Purchase not found');
    await this.ownership.ensureShopAccess(purchase.shopId, user);
    return purchase;
  }

  async update(id: number, user: AuthUser, dto: UpdatePurchaseDto) {
    const old = await this.findOne(id, user);
    const purchase = await this.prisma.purchase.update({
      where: { id },
      data: { ...dto, purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined },
    });
    await this.audit(user.id, 'UPDATE', id, old, purchase);
    return purchase;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.purchase.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Purchase deleted' };
  }

  receipt(id: number, user: AuthUser) {
    return this.findOne(id, user);
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'PURCHASE', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
