import { Injectable } from '@nestjs/common';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async summary(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const [
      totalProducts,
      availableProducts,
      soldProducts,
      todaySales,
      monthlySales,
      purchases,
      expenses,
      lowStockCount,
      repairPendingCount,
      warrantyExpiringCount,
      topItems,
    ] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { shopId, deletedAt: null } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null, availableQuantity: { gt: 0 } } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null, status: 'SOLD' } }),
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, saleDate: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, saleDate: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.purchase.aggregate({ where: { shopId, deletedAt: null }, _sum: { purchasePrice: true } }),
      this.prisma.expense.aggregate({ where: { shopId, deletedAt: null }, _sum: { amount: true } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null, availableQuantity: { lte: 2 } } }),
      this.prisma.repair.count({ where: { shopId, deletedAt: null, status: { in: ['RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING'] } } }),
      this.prisma.warranty.count({ where: { shopId, status: 'ACTIVE', endDate: { lte: this.daysFromNow(30), gte: new Date() } } }),
      this.prisma.saleItem.groupBy({ by: ['productName'], where: { sale: { shopId, deletedAt: null } }, _sum: { quantity: true, totalPrice: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
    ]);
    const grossProfit = Number(monthlySales._sum.totalAmount || 0) - Number(purchases._sum.purchasePrice || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);
    return {
      total_products: totalProducts,
      available_products: availableProducts,
      sold_products: soldProducts,
      today_sales: Number(todaySales._sum.totalAmount || 0),
      monthly_sales: Number(monthlySales._sum.totalAmount || 0),
      total_purchase: Number(purchases._sum.purchasePrice || 0),
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      net_profit: grossProfit - totalExpenses,
      low_stock_count: lowStockCount,
      repair_pending_count: repairPendingCount,
      warranty_expiring_count: warrantyExpiringCount,
      top_selling_products: topItems,
      top_selling_categories: [],
      sales_graph: [],
      expense_graph: [],
      profit_graph: [],
    };
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
