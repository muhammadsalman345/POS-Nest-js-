import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus, SaleType } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateSaleDto, saleType: SaleType) {
    await this.ownership.ensureShopAccess(shopId, user);
    if (!dto.customerId && !dto.customer) throw new BadRequestException('customerId or customer is required');
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: Number(dto.productId), shopId, deletedAt: null } });
      if (!product) throw new NotFoundException('Product not found');
      if (product.status !== ProductStatus.IN_STOCK && product.status !== ProductStatus.RESERVED) {
        throw new BadRequestException('Product is not available for sale');
      }
      const customer = dto.customerId
        ? await tx.customer.findFirst({ where: { id: Number(dto.customerId), deletedAt: null } })
        : await tx.customer.create({ data: dto.customer! });
      if (!customer) throw new NotFoundException('Customer not found');
      const sale = await tx.sale.create({
        data: {
          shopId,
          productId: product.id,
          customerId: customer.id,
          salePrice: dto.salePrice,
          paymentMethod: dto.paymentMethod,
          saleType,
          warrantyDays: dto.warrantyDays || 0,
          invoiceNumber: dto.invoiceNumber || `INV-${Date.now()}`,
          notes: dto.notes,
        },
        include: { shop: true, customer: true, product: true },
      });
      await tx.product.update({ where: { id: product.id }, data: { status: ProductStatus.SOLD, finalSalePrice: dto.salePrice } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', module: 'SALE', recordId: String(sale.id), newData: serializeAuditData(sale) } });
      return sale;
    });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where = { shopId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({ where, skip, take, include: { customer: true, product: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.sale.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const sale = await this.prisma.sale.findFirst({ where: { id, deletedAt: null }, include: { shop: true, customer: true, product: true } });
    if (!sale) throw new NotFoundException('Sale not found');
    await this.ownership.ensureShopAccess(sale.shopId, user);
    return sale;
  }

  async update(id: number, user: AuthUser, dto: UpdateSaleDto) {
    const old = await this.findOne(id, user);
    const sale = await this.prisma.sale.update({ where: { id }, data: { salePrice: dto.salePrice, paymentMethod: dto.paymentMethod, warrantyDays: dto.warrantyDays, notes: dto.notes } });
    await this.audit(user.id, 'UPDATE', id, old, sale);
    return sale;
  }

  async remove(id: number, user: AuthUser) {
    const old = await this.findOne(id, user);
    await this.prisma.sale.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, 'DELETE', id, old, null);
    return { message: 'Sale deleted' };
  }

  invoice(id: number, user: AuthUser) {
    return this.findOne(id, user);
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'SALE', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
