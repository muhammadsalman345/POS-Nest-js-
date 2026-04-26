import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (!dto.sellerId && !dto.seller) throw new BadRequestException('sellerId or seller is required');
    await this.products.ensureImeis(dto.product.imei1, dto.product.imei2);

    return this.prisma.$transaction(async (tx) => {
      const seller = dto.sellerId
        ? await tx.seller.findFirst({ where: { id: Number(dto.sellerId), shopId, deletedAt: null } })
        : await tx.seller.create({ data: { ...dto.seller!, shopId } });
      if (!seller) throw new NotFoundException('Seller not found in this shop');
      const product = await tx.product.create({
        data: {
          ...dto.product,
          shopId,
          sellerId: seller.id,
          purchasePrice: dto.purchase.purchasePrice,
          purchaseDate: new Date(dto.purchase.purchaseDate),
        },
      });
      const purchase = await tx.purchase.create({
        data: {
          shopId,
          sellerId: seller.id,
          productId: product.id,
          purchasePrice: dto.purchase.purchasePrice,
          purchaseDate: new Date(dto.purchase.purchaseDate),
          notes: dto.purchase.notes,
          receiptNumber: dto.purchase.receiptNumber || `PUR-${Date.now()}`,
        },
        include: { seller: true, product: true, shop: true },
      });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', module: 'PURCHASE', recordId: String(purchase.id), newData: serializeAuditData(purchase) } });
      return purchase;
    });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where = { shopId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({ where, skip, take, include: { seller: true, product: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.purchase.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const purchase = await this.prisma.purchase.findFirst({ where: { id, deletedAt: null }, include: { shop: true, seller: true, product: true } });
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
