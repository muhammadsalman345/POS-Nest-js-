import { MarketplaceStatus, PaymentMethod, PrismaClient, ProductCondition, ProductSourceType, ProductStatus, PtaStatus, SaleMode, SaleType, ShopApprovalStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [adminPassword, shopkeeperPassword, customerPassword] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Shop@123', 10),
    bcrypt.hash('Customer@123', 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { phone: '03000000000' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@example.com', phone: '03000000000', password: adminPassword, role: UserRole.SUPER_ADMIN },
  });

  const shopkeeper = await prisma.user.upsert({
    where: { phone: '03111111111' },
    update: {},
    create: { name: 'Ali Mobile Shop', email: 'shopkeeper@example.com', phone: '03111111111', password: shopkeeperPassword, role: UserRole.SELLER },
  });

  const customerUser = await prisma.user.upsert({
    where: { phone: '03222222222' },
    update: {},
    create: { name: 'Test Customer', email: 'customer@example.com', phone: '03222222222', password: customerPassword, role: UserRole.BUYER },
  });

  const categories = ['Mobile Phones', 'Laptops', 'Tablets', 'Smart Watches', 'Accessories', 'Repair Parts', 'Gaming Consoles', 'Cameras'];
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, createdById: admin.id } });
  }

  const expenseCategories = ['Rent', 'Salary', 'Electricity', 'Internet', 'Transport', 'Purchase', 'Marketing', 'Office Expense', 'Misc'];
  for (const name of expenseCategories) {
    const exists = await prisma.expenseCategory.findFirst({ where: { shopId: null, name } });
    if (!exists) await prisma.expenseCategory.create({ data: { name } });
  }

  const permissionNames = [
    'create_product',
    'edit_product',
    'delete_product',
    'view_product',
    'create_sale',
    'discount_sale',
    'refund_sale',
    'view_reports',
    'export_reports',
    'manage_customers',
    'manage_sources',
    'manage_expenses',
    'manage_repairs',
    'manage_warranty',
    'manage_staff',
    'manage_shop_settings',
  ];
  for (const name of permissionNames) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  const staffRoleNames = ['Owner', 'Manager', 'Cashier', 'Salesman', 'Technician', 'Inventory Manager', 'Accountant'];
  for (const name of staffRoleNames) {
    await prisma.staffRole.upsert({ where: { name }, update: {}, create: { name } });
  }

  const shop = await prisma.shop.create({
    data: {
      ownerId: shopkeeper.id,
      name: 'Hafeez Mobile Center',
      slug: 'hafeez-mobile-center',
      address: 'Shop 12, Hafeez Center, Gulberg',
      city: 'Lahore',
      area: 'Gulberg',
      phone: '04235700000',
      isActive: true,
      approvalStatus: ShopApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin.id,
      createdById: admin.id,
    },
  });

  const seller = await prisma.seller.create({
    data: { shopId: shop.id, name: 'Muhammad Usman', fatherName: 'Abdul Rehman', cnic: '35202-1234567-1', phone: '03011234567', address: 'Model Town, Lahore' },
  });

  const product1 = await prisma.product.create({
    data: {
      shopId: shop.id,
      sellerId: seller.id,
      name: 'Apple iPhone 13 Pro',
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      variant: 'Pro',
      imei1: '356789123456789',
      imei2: '356789123456780',
      storage: '256GB',
      ram: '6GB',
      color: 'Graphite',
      condition: ProductCondition.EXCELLENT,
      batteryHealth: 91,
      accessories: 'Box, cable',
      purchasePrice: 165000,
      expectedSalePrice: 185000,
      finalSalePrice: 185000,
      quantity: 1,
      soldQuantity: 1,
      availableQuantity: 0,
      barcode: 'P-SEED-001',
      status: ProductStatus.SOLD,
      ptaStatus: PtaStatus.APPROVED,
      onlineSaleEnabled: false,
      saleMode: SaleMode.OFFLINE_ONLY,
      marketplaceStatus: MarketplaceStatus.HIDDEN,
      sourceType: ProductSourceType.CUSTOMER,
      sourceName: 'Walk-in Seller',
      sourcePhone: '03009998888',
      description: 'Clean device with original display.',
      purchaseDate: new Date(),
      createdById: admin.id,
    },
  });

  await prisma.product.create({
    data: {
      shopId: shop.id,
      sellerId: seller.id,
      name: 'Samsung Galaxy S22',
      brand: 'Samsung',
      model: 'Galaxy S22',
      imei1: '351111123456789',
      storage: '128GB',
      ram: '8GB',
      color: 'Black',
      condition: ProductCondition.GOOD,
      batteryHealth: 88,
      purchasePrice: 112000,
      expectedSalePrice: 128000,
      salePrice: 128000,
      quantity: 1,
      soldQuantity: 0,
      availableQuantity: 1,
      barcode: 'P-SEED-002',
      status: ProductStatus.IN_STOCK,
      ptaStatus: PtaStatus.APPROVED,
      onlineSaleEnabled: true,
      saleMode: SaleMode.BOTH,
      marketplaceStatus: MarketplaceStatus.PUBLISHED,
      sourceType: ProductSourceType.SUPPLIER,
      supplierBusinessName: 'Metro Mobile Wholesale',
      supplierPhone: '03001112222',
      purchaseDate: new Date(),
      createdById: admin.id,
    },
  });

  await prisma.purchase.create({
    data: {
      shopId: shop.id,
      sellerId: seller.id,
      productId: product1.id,
      purchasePrice: 165000,
      purchaseDate: new Date(),
      receiptNumber: 'PUR-SEED-001',
      notes: 'Seed purchase',
      createdById: admin.id,
    },
  });

  const customer = await prisma.customer.create({
    data: { shopId: shop.id, userId: customerUser.id, name: 'Test Customer', phone: '03222222222', cnic: '35202-7654321-2', address: 'Johar Town, Lahore', createdById: admin.id },
  });

  const sale = await prisma.sale.create({
    data: {
      shopId: shop.id,
      productId: product1.id,
      customerId: customer.id,
      salePrice: 185000,
      paymentMethod: PaymentMethod.CASH,
      saleType: SaleType.OFFLINE,
      warrantyDays: 7,
      invoiceNumber: 'INV-SEED-001',
      invoiceNo: 'INV-SEED-001',
      subtotal: 185000,
      totalAmount: 185000,
      paidAmount: 185000,
      dueAmount: 0,
      notes: 'Seed sale',
      createdById: admin.id,
    },
  });

  await prisma.saleItem.create({
    data: { saleId: sale.id, productId: product1.id, productName: 'Apple iPhone 13 Pro', imei1: product1.imei1, imei2: product1.imei2, quantity: 1, unitPrice: 185000, totalPrice: 185000 },
  });

  await prisma.expense.create({
    data: { shopId: shop.id, productId: product1.id, title: 'Screen protector', amount: 1200, type: 'ACCESSORY', paymentMethod: PaymentMethod.CASH, description: 'Applied before sale', createdById: admin.id },
  });

  await prisma.auditLog.create({ data: { userId: admin.id, action: 'SEED', module: 'SYSTEM', recordId: 'seed' } });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
