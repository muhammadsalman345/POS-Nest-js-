import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AlertsModule } from './alerts/alerts.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ImeiModule } from './imei/imei.module';
import { InventoryModule } from './inventory/inventory.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PrismaModule } from './prisma/prisma.module';
import { PurchasesModule } from './purchases/purchases.module';
import { RepairsModule } from './repairs/repairs.module';
import { ReportsModule } from './reports/reports.module';
import { SalesModule } from './sales/sales.module';
import { SellersModule } from './sellers/sellers.module';
import { ShopsModule } from './shops/shops.module';
import { SourcesModule } from './sources/sources.module';
import { StaffModule } from './staff/staff.module';
import { UsersModule } from './users/users.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    CategoriesModule,
    SourcesModule,
    SellersModule,
    CustomersModule,
    ProductsModule,
    PurchasesModule,
    InventoryModule,
    SalesModule,
    ExpensesModule,
    ReportsModule,
    DashboardModule,
    MarketplaceModule,
    AuditLogsModule,
    ImeiModule,
    WarrantiesModule,
    RepairsModule,
    StaffModule,
    AlertsModule,
  ],
})
export class AppModule {}
