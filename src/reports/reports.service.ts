import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ProductStatus, SaleStatus, SaleType } from '@prisma/client';
import { OwnershipService } from '../common/services/ownership.service';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsDashboardQueryDto } from './dto/reports-dashboard-query.dto';

interface ReportDateRange {
  start?: Date;
  end?: Date;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly ownership: OwnershipService) {}

  async dashboardOverview(query: ReportsDashboardQueryDto, user: AuthUser) {
    const shopId = query.shop_id ?? query.shopId;
    const shops = await this.accessibleShops(user, shopId);
    const shopIds = shops.map((shop) => shop.id);
    const range = this.reportDateRange(query);

    if (!shopIds.length) {
      return this.emptyDashboard(query, range);
    }

    const saleWhere: Prisma.SaleWhereInput = {
      shopId: { in: shopIds },
      deletedAt: null,
      status: SaleStatus.COMPLETED,
      ...(range.start || range.end
        ? { saleDate: { ...(range.start ? { gte: range.start } : {}), ...(range.end ? { lte: range.end } : {}) } }
        : {}),
    };
    const purchaseWhere: Prisma.PurchaseWhereInput = {
      shopId: { in: shopIds },
      deletedAt: null,
      ...(range.start || range.end
        ? { purchaseDate: { ...(range.start ? { gte: range.start } : {}), ...(range.end ? { lte: range.end } : {}) } }
        : {}),
    };
    const expenseWhere: Prisma.ExpenseWhereInput = {
      shopId: { in: shopIds },
      deletedAt: null,
      ...(range.start || range.end
        ? { expenseDate: { ...(range.start ? { gte: range.start } : {}), ...(range.end ? { lte: range.end } : {}) } }
        : {}),
    };
    const [sales, purchases, expenses, products, thisMonthSales] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where: saleWhere,
        orderBy: { saleDate: 'asc' },
        include: {
          shop: { select: { id: true, name: true, city: true, country: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  brand: true,
                  model: true,
                  purchasePrice: true,
                  salePrice: true,
                  availableQuantity: true,
                  quantity: true,
                  lowStockAlert: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.purchase.findMany({
        where: purchaseWhere,
        orderBy: { purchaseDate: 'asc' },
        include: {
          shop: { select: { id: true, name: true, country: true } },
          product: { select: { id: true, name: true, sku: true, quantity: true, purchasePrice: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        select: { id: true, shopId: true, amount: true, expenseDate: true, type: true },
      }),
      this.prisma.product.findMany({
        where: { shopId: { in: shopIds }, deletedAt: null },
        include: {
          shop: { select: { id: true, name: true, country: true } },
        },
      }),
      this.prisma.sale.aggregate({
        where: {
          shopId: { in: shopIds },
          deletedAt: null,
          status: SaleStatus.COMPLETED,
          saleDate: { gte: this.startOfMonth(new Date()) },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalSales = this.sum(sales, (sale) => sale.totalAmount);
    const totalPurchases = this.sum(purchases, (purchase) => this.purchaseTotal(purchase));
    const totalExpenses = this.sum(expenses, (expense) => expense.amount);
    const totalPaid = this.sum(sales, (sale) => sale.paidAmount);
    const totalDue = this.sum(sales, (sale) => sale.dueAmount);
    const itemCount = sales.reduce((total, sale) => total + sale.items.reduce((sum, item) => sum + Number(item.quantity), 0), 0);
    const grossProfit = sales.reduce((total, sale) => total + this.saleGrossProfit(sale), 0);
    const activeProducts = products.filter(
      (product) => product.status === ProductStatus.IN_STOCK || product.status === ProductStatus.AVAILABLE,
    );
    const lowStockProducts = activeProducts
      .filter((product) => Number(product.availableQuantity) <= this.lowStockThreshold(product))
      .sort((first, second) => Number(first.availableQuantity) - Number(second.availableQuantity));
    const stockCostValue = activeProducts.reduce((total, product) => total + Number(product.purchasePrice) * Number(product.availableQuantity), 0);
    const stockRetailValue = activeProducts.reduce(
      (total, product) => total + Number(product.salePrice ?? product.purchasePrice) * Number(product.availableQuantity),
      0,
    );

    return {
      filters: {
        period: query.period ?? 'month',
        shopId: shopId ?? null,
        startDate: range.start?.toISOString() ?? null,
        endDate: range.end?.toISOString() ?? null,
      },
      shops: shops.map((shop) => ({ id: shop.id, name: shop.name })),
      summary: {
        totalSales,
        monthlySales: this.numberOrZero(thisMonthSales._sum.totalAmount),
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit: grossProfit - totalExpenses,
        saleCount: sales.length,
        itemCount,
        averageSale: sales.length ? totalSales / sales.length : 0,
        minimumSale: sales.length ? Math.min(...sales.map((sale) => Number(sale.totalAmount))) : 0,
        maximumSale: sales.length ? Math.max(...sales.map((sale) => Number(sale.totalAmount))) : 0,
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        lowStockCount: lowStockProducts.length,
        stockCostValue,
        stockRetailValue,
        paidAmount: totalPaid,
        dueAmount: totalDue,
        unpaidSales: sales.filter((sale) => sale.paymentStatus !== PaymentStatus.PAID).length,
      },
      salesTrend: this.salesTrend(sales, purchases, range),
      channelSales: this.channelSales(sales),
      topProducts: this.productPerformance(products, sales, 'top'),
      slowProducts: this.productPerformance(products, sales, 'slow'),
      lowStockProducts: lowStockProducts.slice(0, 8).map((product) => this.productStockRow(product)),
      shopRows: this.shopRows(shops, sales, products),
      countryRows: this.countryRows(shops, sales),
      recentSales: sales
        .slice()
        .sort((first, second) => second.saleDate.getTime() - first.saleDate.getTime())
        .slice(0, 8)
        .map((sale) => ({
          id: sale.id,
          invoiceNo: sale.invoiceNo || sale.invoiceNumber,
          shopName: sale.shop.name,
          customerName: sale.customer.name,
          saleType: sale.saleType,
          totalAmount: Number(sale.totalAmount),
          paidAmount: Number(sale.paidAmount),
          dueAmount: Number(sale.dueAmount),
          saleDate: sale.saleDate,
        })),
    };
  }

  async dashboard(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [todaySales, monthlySales, totalExpenses, stockValue, totalProducts, oldStock, recentSales, recentPurchases] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, saleDate: { gte: startToday } }, _sum: { totalAmount: true } }),
      this.prisma.sale.aggregate({ where: { shopId, deletedAt: null, saleDate: { gte: startMonth } }, _sum: { totalAmount: true } }),
      this.prisma.expense.aggregate({ where: { shopId, deletedAt: null }, _sum: { amount: true } }),
      this.prisma.product.aggregate({ where: { shopId, deletedAt: null, status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] } }, _sum: { purchasePrice: true } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null } }),
      this.prisma.product.count({ where: { shopId, deletedAt: null, availableQuantity: { lte: 2 } } }),
      this.prisma.sale.findMany({ where: { shopId, deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' }, include: { product: true, customer: true, items: true, payments: true } }),
      this.prisma.purchase.findMany({ where: { shopId, deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' }, include: { product: true, seller: true } }),
    ]);
    const profit = await this.profitLoss(shopId, user);
    return {
      todaySales: todaySales._sum.totalAmount || 0,
      monthlySales: monthlySales._sum.totalAmount || 0,
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
    return this.prisma.sale.findMany({ where: { shopId, deletedAt: null, saleDate: { gte: start } }, include: { product: true, customer: true, items: true, payments: true } });
  }

  async monthlySales(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return this.prisma.sale.findMany({ where: { shopId, deletedAt: null, saleDate: { gte: start } }, include: { product: true, customer: true, items: true, payments: true } });
  }

  async profitLoss(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    const sales = await this.prisma.sale.findMany({
      where: { shopId, deletedAt: null },
      include: { items: { include: { product: { include: { expenses: { where: { deletedAt: null } } } } } } },
    });
    const rows = sales.flatMap((sale) =>
      sale.items.map((item) => {
        const expenses = item.product.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        const purchaseCost = Number(item.product.purchasePrice) * Number(item.quantity);
        const profit = Number(item.totalPrice) - purchaseCost - expenses;
        return { saleId: sale.id, productId: item.productId, salePrice: item.totalPrice, purchasePrice: purchaseCost, expenses, profit };
      }),
    );
    return { rows, grossSales: rows.reduce((s, r) => s + Number(r.salePrice), 0), netProfit: rows.reduce((s, r) => s + r.profit, 0) };
  }

  async stockValue(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.product.aggregate({ where: { shopId, deletedAt: null, status: { in: [ProductStatus.IN_STOCK, ProductStatus.AVAILABLE] } }, _count: true, _sum: { purchasePrice: true, expectedSalePrice: true } });
  }

  async soldProducts(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.product.findMany({ where: { shopId, deletedAt: null, status: ProductStatus.SOLD }, include: { sales: true } });
  }

  async sellerCompliance(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.seller.findMany({ where: { shopId, deletedAt: null }, include: { purchases: true } });
  }

  async suppliers(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.source.findMany({ where: { shopId, deletedAt: null }, include: { purchases: true, products: true } });
  }

  async customers(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.customer.findMany({ where: { shopId, deletedAt: null }, include: { sales: true } });
  }

  async warranties(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.warranty.findMany({ where: { shopId }, include: { product: true, customer: true, claims: true } });
  }

  async repairs(shopId: number, user: AuthUser) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.repair.findMany({ where: { shopId, deletedAt: null }, include: { customer: true, product: true } });
  }

  async imeiHistory(shopId: number, user: AuthUser, imei: string) {
    await this.ownership.ensureShopAccess(shopId, user);
    return this.prisma.imeiHistory.findMany({ where: { shopId, ...(imei ? { imei } : {}) }, include: { product: true }, orderBy: { createdAt: 'desc' } });
  }

  exportReport(shopId: number, user: AuthUser, format: 'pdf' | 'excel') {
    void format;
    return this.dashboard(shopId, user);
  }

  private async accessibleShops(user: AuthUser, shopId?: number) {
    if (shopId) {
      const shop = await this.ownership.ensureShopAccess(shopId, user);
      return [{ id: shop.id, name: shop.name, city: shop.city, country: shop.country }];
    }

    return this.prisma.shop.findMany({
      where: this.ownership.isAdmin(user)
        ? { deletedAt: null }
        : {
            deletedAt: null,
            OR: [
              { ownerId: user.id },
              { staff: { some: { userId: user.id, status: 'ACTIVE' } } },
            ],
          },
      select: { id: true, name: true, city: true, country: true },
      orderBy: { name: 'asc' },
    });
  }

  private reportDateRange(query: ReportsDashboardQueryDto): ReportDateRange {
    const now = new Date();

    if (query.from || query.to) {
      const start = query.from ? new Date(query.from) : undefined;
      const end = query.to ? this.endOfDay(new Date(query.to)) : undefined;

      if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
        throw new BadRequestException('Invalid report date range.');
      }

      if (start && end && start > end) {
        throw new BadRequestException('Report from date must be before to date.');
      }

      return { start, end };
    }

    switch (query.period) {
      case 'today':
        return { start: this.startOfDay(now), end: this.endOfDay(now) };
      case 'week':
        return { start: this.addDays(this.startOfDay(now), -6), end: this.endOfDay(now) };
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: this.endOfDay(now) };
      case 'all':
        return {};
      case 'custom':
      case 'month':
      default:
        return { start: this.startOfMonth(now), end: this.endOfDay(now) };
    }
  }

  private emptyDashboard(query: ReportsDashboardQueryDto, range: ReportDateRange) {
    return {
      filters: {
        period: query.period ?? 'month',
        shopId: query.shop_id ?? query.shopId ?? null,
        startDate: range.start?.toISOString() ?? null,
        endDate: range.end?.toISOString() ?? null,
      },
      shops: [],
      summary: {
        totalSales: 0,
        monthlySales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        saleCount: 0,
        itemCount: 0,
        averageSale: 0,
        minimumSale: 0,
        maximumSale: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockCount: 0,
        stockCostValue: 0,
        stockRetailValue: 0,
        paidAmount: 0,
        dueAmount: 0,
        unpaidSales: 0,
      },
      salesTrend: [],
      channelSales: this.channelSales([]),
      topProducts: [],
      slowProducts: [],
      lowStockProducts: [],
      shopRows: [],
      countryRows: [],
      recentSales: [],
    };
  }

  private salesTrend(sales: any[], purchases: any[], range: ReportDateRange) {
    const useMonths = this.shouldUseMonthlyBuckets(range);
    const rows = new Map<string, { label: string; sales: number; purchases: number; profit: number; count: number }>();

    [...sales.map((sale) => sale.saleDate), ...purchases.map((purchase) => purchase.purchaseDate)].forEach((date) => {
      const key = this.bucketKey(date, useMonths);
      if (!rows.has(key)) rows.set(key, { label: this.bucketLabel(date, useMonths), sales: 0, purchases: 0, profit: 0, count: 0 });
    });

    sales.forEach((sale) => {
      const key = this.bucketKey(sale.saleDate, useMonths);
      const row = rows.get(key) ?? { label: this.bucketLabel(sale.saleDate, useMonths), sales: 0, purchases: 0, profit: 0, count: 0 };
      row.sales += Number(sale.totalAmount);
      row.profit += this.saleGrossProfit(sale);
      row.count += 1;
      rows.set(key, row);
    });

    purchases.forEach((purchase) => {
      const key = this.bucketKey(purchase.purchaseDate, useMonths);
      const row = rows.get(key) ?? { label: this.bucketLabel(purchase.purchaseDate, useMonths), sales: 0, purchases: 0, profit: 0, count: 0 };
      row.purchases += this.purchaseTotal(purchase);
      rows.set(key, row);
    });

    return [...rows.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, row]) => ({ date, ...row }));
  }

  private channelSales(sales: any[]) {
    const total = this.sum(sales, (sale) => sale.totalAmount);

    return [SaleType.OFFLINE, SaleType.ONLINE].map((channel) => {
      const channelSales = sales.filter((sale) => sale.saleType === channel);
      const salesAmount = this.sum(channelSales, (sale) => sale.totalAmount);

      return {
        channel,
        label: channel === SaleType.ONLINE ? 'Online' : 'Offline',
        sales: salesAmount,
        count: channelSales.length,
        percent: total ? (salesAmount / total) * 100 : 0,
      };
    });
  }

  private productPerformance(products: any[], sales: any[], mode: 'top' | 'slow') {
    const rows = new Map<number, { id: number; name: string; sku?: string | null; soldQuantity: number; revenue: number; profit: number; stock: number }>();

    products.forEach((product) => {
      rows.set(product.id, {
        id: product.id,
        name: this.productName(product),
        sku: product.sku,
        soldQuantity: 0,
        revenue: 0,
        profit: 0,
        stock: Number(product.availableQuantity),
      });
    });

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = item.product;
        const id = Number(item.productId);
        const row = rows.get(id) ?? {
          id,
          name: item.productName || this.productName(product),
          sku: product?.sku,
          soldQuantity: 0,
          revenue: 0,
          profit: 0,
          stock: Number(product?.availableQuantity ?? 0),
        };
        row.soldQuantity += Number(item.quantity);
        row.revenue += Number(item.totalPrice);
        row.profit += Number(item.totalPrice) - Number(product?.purchasePrice ?? 0) * Number(item.quantity);
        rows.set(id, row);
      });
    });

    return [...rows.values()]
      .filter((row) => mode === 'top' ? row.soldQuantity > 0 : row.stock > 0)
      .sort((first, second) =>
        mode === 'top'
          ? second.revenue - first.revenue || second.soldQuantity - first.soldQuantity
          : first.soldQuantity - second.soldQuantity || first.revenue - second.revenue,
      )
      .slice(0, 8);
  }

  private shopRows(shops: any[], sales: any[], products: any[]) {
    return shops.map((shop) => {
      const shopSales = sales.filter((sale) => sale.shopId === shop.id);
      const shopProducts = products.filter((product) => product.shopId === shop.id);
      return {
        shopId: shop.id,
        shopName: shop.name,
        city: shop.city,
        sales: this.sum(shopSales, (sale) => sale.totalAmount),
        profit: shopSales.reduce((total, sale) => total + this.saleGrossProfit(sale), 0),
        orders: shopSales.length,
        products: shopProducts.length,
        lowStock: shopProducts.filter((product) => Number(product.availableQuantity) <= this.lowStockThreshold(product)).length,
      };
    }).sort((first, second) => second.sales - first.sales);
  }

  private countryRows(shops: any[], sales: any[]) {
    const rows = new Map<string, { country: string; shops: number; sales: number; orders: number }>();

    shops.forEach((shop) => {
      const country = shop.country || 'Unknown';
      const row = rows.get(country) ?? { country, shops: 0, sales: 0, orders: 0 };
      row.shops += 1;
      rows.set(country, row);
    });

    sales.forEach((sale) => {
      const country = sale.shop?.country || 'Unknown';
      const row = rows.get(country) ?? { country, shops: 0, sales: 0, orders: 0 };
      row.sales += Number(sale.totalAmount);
      row.orders += 1;
      rows.set(country, row);
    });

    return [...rows.values()].sort((first, second) => second.sales - first.sales);
  }

  private productStockRow(product: any) {
    return {
      id: product.id,
      name: this.productName(product),
      sku: product.sku,
      shopName: product.shop?.name,
      stock: Number(product.availableQuantity),
      minimumStock: this.lowStockThreshold(product),
      purchasePrice: Number(product.purchasePrice),
      salePrice: Number(product.salePrice ?? product.purchasePrice),
    };
  }

  private saleGrossProfit(sale: any): number {
    const itemProfit = sale.items.reduce((total: number, item: any) => {
      return total + Number(item.totalPrice) - Number(item.product?.purchasePrice ?? 0) * Number(item.quantity);
    }, 0);

    return itemProfit - Number(sale.discountAmount ?? 0) + Number(sale.taxAmount ?? 0);
  }

  private purchaseTotal(purchase: any): number {
    return Number(purchase.purchasePrice) * Math.max(1, Number(purchase.product?.quantity ?? 1));
  }

  private productName(product: any): string {
    if (!product) return 'Unknown product';
    return product.name || [product.brand, product.model].filter(Boolean).join(' ') || `Product ${product.id}`;
  }

  private lowStockThreshold(product: any): number {
    const threshold = Number(product.lowStockAlert);
    return Number.isFinite(threshold) && threshold > 0 ? threshold : 2;
  }

  private sum<T>(items: T[], selector: (item: T) => unknown): number {
    return items.reduce((total, item) => total + this.numberOrZero(selector(item)), 0);
  }

  private numberOrZero(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private shouldUseMonthlyBuckets(range: ReportDateRange): boolean {
    if (!range.start || !range.end) return true;
    return Math.abs(range.end.getTime() - range.start.getTime()) > 62 * 24 * 60 * 60 * 1000;
  }

  private bucketKey(date: Date, monthly: boolean): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return monthly ? `${date.getFullYear()}-${month}` : `${date.getFullYear()}-${month}-${day}`;
  }

  private bucketLabel(date: Date, monthly: boolean): string {
    return monthly
      ? date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      : date.toLocaleString('en-US', { day: '2-digit', month: 'short' });
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
