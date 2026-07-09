import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertType } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async list(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    await this.generate(shopId);
    return this.prisma.alert.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  }

  async read(id: number, user: AuthUser) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    await this.ownership.ensureShopAccess(alert.shopId, user);
    return this.prisma.alert.update({ where: { id }, data: { isRead: true } });
  }

  async readAll(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    await this.prisma.alert.updateMany({ where: { shopId, isRead: false }, data: { isRead: true } });
    return { message: 'Alerts marked read' };
  }

  private async generate(shopId: number) {
    const products = await this.prisma.product.findMany({ where: { shopId, deletedAt: null } });
    for (const product of products) {
      if (product.availableQuantity <= 0) {
        await this.upsert(shopId, AlertType.OUT_OF_STOCK, 'Out of stock', `${product.name || product.brand} is out of stock`, 'PRODUCT', product.id);
      } else if (product.availableQuantity <= 2) {
        await this.upsert(shopId, AlertType.LOW_STOCK, 'Low stock', `${product.name || product.brand} has low stock`, 'PRODUCT', product.id);
      }
      const daysOld = (Date.now() - new Date(product.purchaseDate).getTime()) / 86400000;
      if (daysOld >= 90 && product.availableQuantity > 0) {
        await this.upsert(shopId, AlertType.OLD_INVENTORY, 'Old inventory', `${product.name || product.brand} has been unsold for more than 90 days`, 'PRODUCT', product.id);
      }
    }
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const warranties = await this.prisma.warranty.findMany({ where: { shopId, status: 'ACTIVE', endDate: { lte: soon, gte: new Date() } } });
    for (const warranty of warranties) {
      await this.upsert(shopId, AlertType.WARRANTY_EXPIRING, 'Warranty expiring', `Warranty ${warranty.id} is expiring soon`, 'WARRANTY', warranty.id);
    }
    const repairs = await this.prisma.repair.findMany({ where: { shopId, deletedAt: null, status: { in: ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING', 'COMPLETED'] }, expectedDeliveryDate: { lt: new Date() } } });
    for (const repair of repairs) {
      await this.upsert(shopId, AlertType.REPAIR_DELAYED, 'Repair delayed', `Repair ${repair.ticketNo} is past expected delivery`, 'REPAIR', repair.id);
    }
  }

  private async upsert(shopId: number, type: AlertType, title: string, message: string, referenceType: string, referenceId: number) {
    const exists = await this.prisma.alert.findFirst({ where: { shopId, type, referenceType, referenceId: String(referenceId), isRead: false } });
    if (exists) return exists;
    return this.prisma.alert.create({ data: { shopId, type, title, message, referenceType, referenceId: String(referenceId) } });
  }
}
