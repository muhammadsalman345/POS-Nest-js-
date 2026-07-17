import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ImeiEventType, PaymentMethod, PaymentStatus, ProductStatus, SaleStatus, SaleType } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { serializeAuditData } from '../common/utils/audit.util';
import { paginated, pagination } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { saleCollection, saleResource } from './resources/sale.resource';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async create(shopId: number, user: AuthUser, dto: CreateSaleDto, saleType: SaleType) {
    await this.ownership.ensureShopAccess(shopId, user);
    if (!dto.customerId && !dto.customer) throw new BadRequestException('customerId or customer is required');
    const requestedItems = dto.items?.length
      ? dto.items
      : dto.productId
        ? [{ productId: Number(dto.productId), quantity: 1, unitPrice: Number(dto.salePrice), discountAmount: 0 }]
        : [];
    if (!requestedItems.length) throw new BadRequestException('At least one sale item is required');
    if (requestedItems.some((item) => !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0)) {
      throw new BadRequestException('A valid unitPrice or salePrice is required');
    }
    return this.prisma.$transaction(async (tx) => {
      const customer = dto.customerId
        ? await tx.customer.findFirst({ where: { id: Number(dto.customerId), OR: [{ shopId }, { shopId: null }], deletedAt: null } })
        : await tx.customer.create({ data: { ...dto.customer!, shopId, createdById: user.id } });
      if (!customer) throw new NotFoundException('Customer not found');
      const products = await tx.product.findMany({
        where: { id: { in: requestedItems.map((item) => Number(item.productId)) }, shopId, deletedAt: null },
      });
      if (products.length !== requestedItems.length) throw new NotFoundException('One or more products were not found in this shop');
      const saleableStatuses: ProductStatus[] = [
        ProductStatus.IN_STOCK,
        ProductStatus.AVAILABLE,
        ProductStatus.RESERVED,
        ProductStatus.RETURNED,
      ];
      const saleItems = requestedItems.map((item) => {
        const product = products.find((found) => found.id === Number(item.productId));
        if (!product) throw new NotFoundException('Product not found');
        if (!saleableStatuses.includes(product.status)) {
          throw new BadRequestException(`${product.name || product.brand} is not available for sale`);
        }
        if (Number(product.availableQuantity) < Number(item.quantity)) throw new BadRequestException(`${product.name || product.brand} has insufficient stock`);
        const discountAmount = Number(item.discountAmount || 0);
        const totalPrice = Number(item.unitPrice) * Number(item.quantity) - discountAmount;
        return { item, product, discountAmount, totalPrice };
      });
      const subtotal = saleItems.reduce((sum, item) => sum + Number(item.item.unitPrice) * Number(item.item.quantity), 0);
      const discountAmount = Number(dto.discountAmount || 0);
      const taxAmount = Number(dto.taxAmount || 0);
      const itemsDiscount = saleItems.reduce((sum, item) => sum + item.discountAmount, 0);
      const totalAmount = Math.max(subtotal - discountAmount - itemsDiscount + taxAmount, 0);
      const paidAmount = Math.min(Number(dto.paidAmount ?? totalAmount), totalAmount);
      const dueAmount = totalAmount - paidAmount;
      const paymentStatus = paidAmount <= 0 ? PaymentStatus.UNPAID : dueAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PAID;
      const invoiceNumber = dto.invoiceNumber || dto.invoiceNo || `INV-${shopId}-${Date.now()}`;
      const sale = await tx.sale.create({
        data: {
          shopId,
          productId: saleItems[0].product.id,
          customerId: customer.id,
          salePrice: totalAmount,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          saleType,
          saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
          warrantyDays: dto.warrantyDays || 0,
          invoiceNumber,
          invoiceNo: dto.invoiceNo || invoiceNumber,
          subtotal,
          discountType: dto.discountType,
          discountAmount,
          taxAmount,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentStatus,
          status: SaleStatus.COMPLETED,
          notes: dto.notes,
          createdById: user.id,
        },
        include: { shop: true, customer: true, product: true, items: true, payments: true },
      });
      for (const { item, product, discountAmount: itemDiscount, totalPrice } of saleItems) {
        const newSoldQuantity = Number(product.soldQuantity) + Number(item.quantity);
        const newAvailableQuantity = Number(product.quantity) - newSoldQuantity;
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            productName: product.name || `${product.brand} ${product.model}`.trim(),
            imei1: product.imei1,
            imei2: product.imei2,
            serialNumber: product.serialNumber,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountAmount: itemDiscount,
            totalPrice,
          },
        });
        await tx.product.update({
          where: { id: product.id },
          data: {
            soldQuantity: newSoldQuantity,
            availableQuantity: Math.max(newAvailableQuantity, 0),
            status: newAvailableQuantity <= 0 ? ProductStatus.SOLD : ProductStatus.AVAILABLE,
            finalSalePrice: Number(item.unitPrice),
          },
        });
        const imei = product.imei1 || product.serialNumber;
        if (imei) {
          await tx.imeiHistory.create({
            data: {
              shopId,
              productId: product.id,
              imei,
              serialNumber: product.serialNumber,
              eventType: ImeiEventType.SALE,
              referenceType: 'SALE',
              referenceId: String(sale.id),
              previousStatus: String(product.status),
              newStatus: newAvailableQuantity <= 0 ? String(ProductStatus.SOLD) : String(ProductStatus.AVAILABLE),
              newOwnerName: customer.name,
              createdById: user.id,
            },
          });
        }
      }
      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            shopId,
            saleId: sale.id,
            customerId: customer.id,
            amount: paidAmount,
            paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
            referenceNo: dto.paymentReferenceNo,
            createdById: user.id,
          },
        });
      }
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE', module: 'SALE', recordId: String(sale.id), newData: serializeAuditData(sale) } });
      return saleResource(await tx.sale.findUnique({ where: { id: sale.id }, include: { shop: true, customer: true, product: true, items: true, payments: true } }));
    });
  }

  async list(shopId: number, user: AuthUser, query: PaginationDto) {
    await this.ownership.ensureShopAccess(shopId, user);
    const { page, limit, skip, take } = pagination(query);
    const where = { shopId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({ where, skip, take, include: { customer: true, product: true, items: true, payments: true }, orderBy: { [query.sortBy || 'createdAt']: query.sortOrder } }),
      this.prisma.sale.count({ where }),
    ]);
    return paginated(saleCollection(items), total, page, limit);
  }

  async findOne(id: number, user: AuthUser) {
    const sale = await this.prisma.sale.findFirst({ where: { id, deletedAt: null }, include: { shop: true, customer: true, product: true, items: true, payments: true } });
    if (!sale) throw new NotFoundException('Sale not found');
    await this.ownership.ensureShopAccess(sale.shopId, user);
    return saleResource(sale);
  }

  async update(id: number, user: AuthUser, dto: UpdateSaleDto) {
    const old = await this.findOne(id, user);
    const sale = await this.prisma.sale.update({ where: { id }, data: { salePrice: dto.salePrice, paymentMethod: dto.paymentMethod, warrantyDays: dto.warrantyDays, notes: dto.notes, updatedById: user.id } });
    await this.audit(user.id, 'UPDATE', id, old, sale);
    return saleResource(sale);
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

  async addPayment(id: number, user: AuthUser, dto: { amount: number; paymentMethod: PaymentMethod; referenceNo?: string; notes?: string }) {
    const sale = await this.findOne(id, user);
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { shopId: sale.shopId, saleId: sale.id, customerId: sale.customerId, amount: Number(dto.amount), paymentMethod: dto.paymentMethod, referenceNo: dto.referenceNo, notes: dto.notes, createdById: user.id },
      });
      const paidAmount = Number(sale.paidAmount) + Number(dto.amount);
      const dueAmount = Math.max(Number(sale.totalAmount) - paidAmount, 0);
      await tx.sale.update({
        where: { id },
        data: {
          paidAmount,
          dueAmount,
          paymentStatus: paidAmount <= 0 ? PaymentStatus.UNPAID : dueAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PAID,
          updatedById: user.id,
        },
      });
      return payment;
    });
  }

  async cancel(id: number, user: AuthUser) {
    const sale = await this.findOne(id, user);
    await this.prisma.sale.update({ where: { id }, data: { status: SaleStatus.CANCELLED, updatedById: user.id } });
    await this.audit(user.id, 'CANCEL', id, sale, null);
    return { message: 'Sale cancelled' };
  }

  async refund(id: number, user: AuthUser) {
    const sale = await this.findOne(id, user);
    await this.prisma.sale.update({ where: { id }, data: { status: SaleStatus.REFUNDED, updatedById: user.id } });
    await this.audit(user.id, 'REFUND', id, sale, null);
    return { message: 'Sale refunded' };
  }

  private audit(userId: number, action: string, recordId: number, oldData: unknown, newData: unknown) {
    return this.prisma.auditLog.create({
      data: { userId, action, module: 'SALE', recordId: String(recordId), oldData: serializeAuditData(oldData), newData: serializeAuditData(newData) },
    });
  }
}
