import { PrismaClient, ProductCondition, ProductStatus, PtaStatus, UserRole, PaymentMethod, SaleType, ShopApprovalStatus, ProductSourceType } from '@prisma/client';
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

  const shop = await prisma.shop.create({
    data: {
      ownerId: shopkeeper.id,
      name: 'Hafeez Mobile Center',
      address: 'Shop 12, Hafeez Center, Gulberg',
      city: 'Lahore',
      area: 'Gulberg',
      phone: '04235700000',
      isActive: true,
      approvalStatus: ShopApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  });

  const seller = await prisma.seller.create({
    data: { shopId: shop.id, name: 'Muhammad Usman', fatherName: 'Abdul Rehman', cnic: '35202-1234567-1', phone: '03011234567', address: 'Model Town, Lahore' },
  });

  const product1 = await prisma.product.create({
    data: {
      shopId: shop.id,
      sellerId: seller.id,
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
      status: ProductStatus.SOLD,
      ptaStatus: PtaStatus.APPROVED,
      onlineSaleEnabled: false,
      sourceType: ProductSourceType.CUSTOMER,
      sourceName: 'Walk-in Seller',
      sourcePhone: '03009998888',
      description: 'Clean device with original display.',
      purchaseDate: new Date(),
    },
  });

  await prisma.product.create({
    data: {
      shopId: shop.id,
      sellerId: seller.id,
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
      status: ProductStatus.IN_STOCK,
      ptaStatus: PtaStatus.APPROVED,
      onlineSaleEnabled: true,
      sourceType: ProductSourceType.SUPPLIER,
      supplierBusinessName: 'Metro Mobile Wholesale',
      supplierPhone: '03001112222',
      purchaseDate: new Date(),
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
    },
  });

  const customer = await prisma.customer.create({
    data: { userId: customerUser.id, name: 'Test Customer', phone: '03222222222', cnic: '35202-7654321-2', address: 'Johar Town, Lahore' },
  });

  await prisma.sale.create({
    data: {
      shopId: shop.id,
      productId: product1.id,
      customerId: customer.id,
      salePrice: 185000,
      paymentMethod: PaymentMethod.CASH,
      saleType: SaleType.OFFLINE,
      warrantyDays: 7,
      invoiceNumber: 'INV-SEED-001',
      notes: 'Seed sale',
    },
  });

  await prisma.expense.create({
    data: { shopId: shop.id, productId: product1.id, title: 'Screen protector', amount: 1200, type: 'ACCESSORY', description: 'Applied before sale' },
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
