import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async dashboard(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [todaySales, monthlySales, totalExpenses, stockValue, totalProducts, oldStock, recentSales, recentPurchases] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, createdAt: { gte: startToday } }, _sum: { salePrice: true } }),
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, createdAt: { gte: startMonth } }, _sum: { salePrice: true } }),
      this.prisma.expense.aggregate({ where: { shopId, deletedAt: null }, _sum: { amount: true } }),
      this.prisma.product.aggregate({ where: { shopId, deletedAt: null, status: ProductStatus.IN_STOCK }, _sum: { purchasePrice: true } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null, status: ProductStatus.IN_STOCK, createdAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } } }),
      this.prisma.sale.findMany({ where: { shopId, deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' }, include: { product: true, customer: true } }),
      this.prisma.purchase.findMany({ where: { shopId, deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' }, include: { product: true, seller: true } }),
    ]);
    const profit = await this.profitLoss(shopId, user);
    return {
      todaySales: todaySales._sum.salePrice || 0,
      monthlySales: monthlySales._sum.salePrice || 0,
      totalProfit: profit.netProfit,
      totalExpenses: totalExpenses._sum.amount || 0,
      stockValue: stockValue._sum.purchasePrice || 0,
      totalProducts,
      lowStock: oldStock,
      recentSales,
      recentPurchases,
    };
  }

  async dailySales(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.sale.findMany({ where: { shopId, deletedAt: null, createdAt: { gte: start } }, include: { product: true, customer: true } });
  }

  async monthlySales(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return this.prisma.sale.findMany({ where: { shopId, deletedAt: null, createdAt: { gte: start } }, include: { product: true, customer: true } });
  }

  async profitLoss(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const sales = await this.prisma.sale.findMany({ where: { shopId, deletedAt: null }, include: { product: { include: { expenses: { where: { deletedAt: null } } } } } });
    const rows = sales.map((sale) => {
      const expenses = sale.product.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const profit = Number(sale.salePrice) - Number(sale.product.purchasePrice) - expenses;
      return { saleId: sale.id, productId: sale.productId, salePrice: sale.salePrice, purchasePrice: sale.product.purchasePrice, expenses, profit };
    });
    return { rows, grossSales: rows.reduce((s, r) => s + Number(r.salePrice), 0), netProfit: rows.reduce((s, r) => s + r.profit, 0) };
  }

  async stockValue(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.product.aggregate({ where: { shopId, deletedAt: null, status: ProductStatus.IN_STOCK }, _count: true, _sum: { purchasePrice: true, expectedSalePrice: true } });
  }

  async soldProducts(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.product.findMany({ where: { shopId, deletedAt: null, status: ProductStatus.SOLD }, include: { sales: true } });
  }

  async sellerCompliance(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.seller.findMany({ where: { shopId, deletedAt: null }, include: { purchases: true } });
  }

  async imeiHistory(shopId: number, user: AuthUser, imei: string) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.product.findMany({
      where: { shopId, deletedAt: null, OR: [{ imei1: imei }, { imei2: imei }] },
      include: { purchase: true, sales: true, seller: true, expenses: true },
    });
  }
}
