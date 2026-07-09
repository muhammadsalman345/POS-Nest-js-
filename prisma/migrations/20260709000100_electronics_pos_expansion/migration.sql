-- Expand existing enums for the electronics POS domain.
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'SELLER', 'BUYER') NOT NULL;
ALTER TABLE `Product` MODIFY `condition` ENUM('NEW', 'USED', 'REFURBISHED', 'OPEN_BOX', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED') NOT NULL;
ALTER TABLE `Product` MODIFY `status` ENUM('IN_STOCK', 'AVAILABLE', 'RESERVED', 'SOLD', 'RETURNED', 'DAMAGED', 'UNDER_REPAIR', 'REPAIR') NOT NULL DEFAULT 'IN_STOCK';
ALTER TABLE `Sale` MODIFY `paymentMethod` ENUM('CASH', 'BANK', 'JAZZCASH', 'EASYPAISA', 'CARD', 'OTHER') NOT NULL;

-- Users
ALTER TABLE `User`
  ADD COLUMN `status` ENUM('ACTIVE', 'BLOCKED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL;
CREATE INDEX `User_status_idx` ON `User`(`status`);

-- Shops
ALTER TABLE `Shop`
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `province` VARCHAR(191) NULL,
  ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'Pakistan',
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `coverImage` VARCHAR(191) NULL,
  ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE UNIQUE INDEX `Shop_slug_key` ON `Shop`(`slug`);
CREATE INDEX `Shop_status_idx` ON `Shop`(`status`);

-- Categories
CREATE TABLE `Category` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `parentId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `image` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `createdById` INTEGER NULL,
  `updatedById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  UNIQUE INDEX `Category_slug_key`(`slug`),
  INDEX `Category_parentId_idx`(`parentId`),
  INDEX `Category_status_idx`(`status`),
  INDEX `Category_deletedAt_idx`(`deletedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Sources
CREATE TABLE `Source` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `type` ENUM('SUPPLIER', 'INDIVIDUAL') NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `companyName` VARCHAR(191) NULL,
  `fatherName` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `cnic` VARCHAR(191) NULL,
  `cnicFrontImage` VARCHAR(191) NULL,
  `cnicBackImage` VARCHAR(191) NULL,
  `selfieImage` VARCHAR(191) NULL,
  `address` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `province` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL DEFAULT 'Pakistan',
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `taxNumber` VARCHAR(191) NULL,
  `notes` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `createdById` INTEGER NULL,
  `updatedById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  INDEX `Source_shopId_idx`(`shopId`),
  INDEX `Source_type_idx`(`type`),
  INDEX `Source_phone_idx`(`phone`),
  INDEX `Source_cnic_idx`(`cnic`),
  INDEX `Source_deletedAt_idx`(`deletedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Source` ADD CONSTRAINT `Source_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Customers
ALTER TABLE `Customer`
  ADD COLUMN `shopId` INTEGER NULL,
  ADD COLUMN `fatherName` VARCHAR(191) NULL,
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `cnicFrontImage` VARCHAR(191) NULL,
  ADD COLUMN `cnicBackImage` VARCHAR(191) NULL,
  ADD COLUMN `selfieImage` VARCHAR(191) NULL,
  ADD COLUMN `city` VARCHAR(191) NULL,
  ADD COLUMN `province` VARCHAR(191) NULL,
  ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'Pakistan',
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `notes` VARCHAR(191) NULL,
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE INDEX `Customer_shopId_idx` ON `Customer`(`shopId`);
CREATE INDEX `Customer_cnic_idx` ON `Customer`(`cnic`);
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Products
ALTER TABLE `Product`
  MODIFY `sellerId` INTEGER NULL,
  MODIFY `imei1` VARCHAR(191) NULL,
  ADD COLUMN `categoryId` INTEGER NULL,
  ADD COLUMN `sourceId` INTEGER NULL,
  ADD COLUMN `name` VARCHAR(191) NULL,
  ADD COLUMN `serialNumber` VARCHAR(191) NULL,
  ADD COLUMN `salePrice` DECIMAL(12, 2) NULL,
  ADD COLUMN `minimumSalePrice` DECIMAL(12, 2) NULL,
  ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `soldQuantity` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `availableQuantity` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `barcode` VARCHAR(191) NULL,
  ADD COLUMN `qrCode` TEXT NULL,
  ADD COLUMN `warrantyType` ENUM('NONE', 'SHOP', 'COMPANY', 'INTERNATIONAL') NOT NULL DEFAULT 'NONE',
  ADD COLUMN `warrantyMonths` INTEGER NULL,
  ADD COLUMN `saleMode` ENUM('OFFLINE_ONLY', 'ONLINE_MARKETPLACE', 'BOTH') NOT NULL DEFAULT 'OFFLINE_ONLY',
  ADD COLUMN `marketplaceStatus` ENUM('HIDDEN', 'PUBLISHED', 'PENDING', 'REJECTED') NOT NULL DEFAULT 'HIDDEN',
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE UNIQUE INDEX `Product_serialNumber_key` ON `Product`(`serialNumber`);
CREATE UNIQUE INDEX `Product_barcode_key` ON `Product`(`barcode`);
CREATE INDEX `Product_categoryId_idx` ON `Product`(`categoryId`);
CREATE INDEX `Product_sourceId_idx` ON `Product`(`sourceId`);
CREATE INDEX `Product_saleMode_marketplaceStatus_idx` ON `Product`(`saleMode`, `marketplaceStatus`);
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Product` ADD CONSTRAINT `Product_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Product images
ALTER TABLE `ProductImage`
  ADD COLUMN `imagePath` VARCHAR(191) NULL,
  ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Purchases
ALTER TABLE `Purchase`
  MODIFY `sellerId` INTEGER NULL,
  ADD COLUMN `sourceId` INTEGER NULL,
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE INDEX `Purchase_sourceId_idx` ON `Purchase`(`sourceId`);
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Sales
ALTER TABLE `Sale`
  MODIFY `productId` INTEGER NULL,
  MODIFY `salePrice` DECIMAL(12, 2) NULL,
  ADD COLUMN `invoiceNo` VARCHAR(191) NULL,
  ADD COLUMN `saleDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `discountType` ENUM('FIXED', 'PERCENTAGE') NULL,
  ADD COLUMN `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `paidAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `dueAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `paymentStatus` ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `status` ENUM('DRAFT', 'COMPLETED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE UNIQUE INDEX `Sale_invoiceNo_key` ON `Sale`(`invoiceNo`);
CREATE INDEX `Sale_status_idx` ON `Sale`(`status`);
CREATE INDEX `Sale_saleDate_idx` ON `Sale`(`saleDate`);

CREATE TABLE `SaleItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `saleId` INTEGER NOT NULL,
  `productId` INTEGER NOT NULL,
  `productName` VARCHAR(191) NOT NULL,
  `imei1` VARCHAR(191) NULL,
  `imei2` VARCHAR(191) NULL,
  `serialNumber` VARCHAR(191) NULL,
  `quantity` INTEGER NOT NULL DEFAULT 1,
  `unitPrice` DECIMAL(12, 2) NOT NULL,
  `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `totalPrice` DECIMAL(12, 2) NOT NULL,
  INDEX `SaleItem_saleId_idx`(`saleId`),
  INDEX `SaleItem_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `Payment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `saleId` INTEGER NOT NULL,
  `customerId` INTEGER NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `paymentMethod` ENUM('CASH', 'BANK', 'JAZZCASH', 'EASYPAISA', 'CARD', 'OTHER') NOT NULL,
  `referenceNo` VARCHAR(191) NULL,
  `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` VARCHAR(191) NULL,
  `createdById` INTEGER NULL,
  INDEX `Payment_shopId_idx`(`shopId`),
  INDEX `Payment_saleId_idx`(`saleId`),
  INDEX `Payment_customerId_idx`(`customerId`),
  INDEX `Payment_paymentDate_idx`(`paymentDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- IMEI history
CREATE TABLE `ImeiHistory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `productId` INTEGER NULL,
  `imei` VARCHAR(191) NOT NULL,
  `serialNumber` VARCHAR(191) NULL,
  `eventType` ENUM('PURCHASE', 'SALE', 'RETURN', 'REPAIR_IN', 'REPAIR_OUT', 'WARRANTY_CLAIM', 'TRANSFER', 'STATUS_CHANGE') NOT NULL,
  `referenceType` VARCHAR(191) NULL,
  `referenceId` VARCHAR(191) NULL,
  `previousStatus` VARCHAR(191) NULL,
  `newStatus` VARCHAR(191) NULL,
  `previousOwnerName` VARCHAR(191) NULL,
  `newOwnerName` VARCHAR(191) NULL,
  `notes` VARCHAR(191) NULL,
  `createdById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ImeiHistory_shopId_idx`(`shopId`),
  INDEX `ImeiHistory_productId_idx`(`productId`),
  INDEX `ImeiHistory_imei_idx`(`imei`),
  INDEX `ImeiHistory_eventType_idx`(`eventType`),
  INDEX `ImeiHistory_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `ImeiHistory` ADD CONSTRAINT `ImeiHistory_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ImeiHistory` ADD CONSTRAINT `ImeiHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Warranty
CREATE TABLE `Warranty` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `productId` INTEGER NOT NULL,
  `saleId` INTEGER NULL,
  `customerId` INTEGER NULL,
  `warrantyType` ENUM('NONE', 'SHOP', 'COMPANY', 'INTERNATIONAL') NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `warrantyMonths` INTEGER NOT NULL,
  `invoiceNo` VARCHAR(191) NULL,
  `terms` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'EXPIRED', 'CLAIMED', 'REJECTED') NOT NULL DEFAULT 'ACTIVE',
  `createdById` INTEGER NULL,
  `updatedById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Warranty_shopId_idx`(`shopId`),
  INDEX `Warranty_productId_idx`(`productId`),
  INDEX `Warranty_saleId_idx`(`saleId`),
  INDEX `Warranty_customerId_idx`(`customerId`),
  INDEX `Warranty_status_idx`(`status`),
  INDEX `Warranty_endDate_idx`(`endDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Warranty` ADD CONSTRAINT `Warranty_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Warranty` ADD CONSTRAINT `Warranty_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Warranty` ADD CONSTRAINT `Warranty_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Warranty` ADD CONSTRAINT `Warranty_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `WarrantyClaim` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `warrantyId` INTEGER NOT NULL,
  `productId` INTEGER NOT NULL,
  `customerId` INTEGER NULL,
  `claimDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `issueDescription` VARCHAR(191) NOT NULL,
  `resolution` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `notes` VARCHAR(191) NULL,
  `createdById` INTEGER NULL,
  `updatedById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `WarrantyClaim_shopId_idx`(`shopId`),
  INDEX `WarrantyClaim_warrantyId_idx`(`warrantyId`),
  INDEX `WarrantyClaim_productId_idx`(`productId`),
  INDEX `WarrantyClaim_customerId_idx`(`customerId`),
  INDEX `WarrantyClaim_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `WarrantyClaim` ADD CONSTRAINT `WarrantyClaim_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WarrantyClaim` ADD CONSTRAINT `WarrantyClaim_warrantyId_fkey` FOREIGN KEY (`warrantyId`) REFERENCES `Warranty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WarrantyClaim` ADD CONSTRAINT `WarrantyClaim_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WarrantyClaim` ADD CONSTRAINT `WarrantyClaim_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Repairs
CREATE TABLE `Repair` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `customerId` INTEGER NOT NULL,
  `productId` INTEGER NULL,
  `ticketNo` VARCHAR(191) NOT NULL,
  `deviceName` VARCHAR(191) NOT NULL,
  `brand` VARCHAR(191) NULL,
  `model` VARCHAR(191) NULL,
  `imei1` VARCHAR(191) NULL,
  `serialNumber` VARCHAR(191) NULL,
  `problemDescription` VARCHAR(191) NOT NULL,
  `estimatedCost` DECIMAL(12, 2) NULL,
  `finalCost` DECIMAL(12, 2) NULL,
  `technicianId` INTEGER NULL,
  `status` ENUM('RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING', 'COMPLETED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED',
  `receivedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expectedDeliveryDate` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,
  `notes` VARCHAR(191) NULL,
  `createdById` INTEGER NULL,
  `updatedById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  UNIQUE INDEX `Repair_ticketNo_key`(`ticketNo`),
  INDEX `Repair_shopId_idx`(`shopId`),
  INDEX `Repair_customerId_idx`(`customerId`),
  INDEX `Repair_productId_idx`(`productId`),
  INDEX `Repair_technicianId_idx`(`technicianId`),
  INDEX `Repair_status_idx`(`status`),
  INDEX `Repair_deletedAt_idx`(`deletedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `RepairImage` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `repairId` INTEGER NOT NULL,
  `imagePath` VARCHAR(191) NOT NULL,
  `type` ENUM('BEFORE', 'AFTER', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `RepairImage_repairId_idx`(`repairId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `RepairImage` ADD CONSTRAINT `RepairImage_repairId_fkey` FOREIGN KEY (`repairId`) REFERENCES `Repair`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Expenses
CREATE TABLE `ExpenseCategory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ExpenseCategory_shopId_idx`(`shopId`),
  UNIQUE INDEX `ExpenseCategory_shopId_name_key`(`shopId`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `ExpenseCategory` ADD CONSTRAINT `ExpenseCategory_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Expense`
  ADD COLUMN `expenseCategoryId` INTEGER NULL,
  ADD COLUMN `paymentMethod` ENUM('CASH', 'BANK', 'JAZZCASH', 'EASYPAISA', 'CARD', 'OTHER') NULL,
  ADD COLUMN `referenceNo` VARCHAR(191) NULL,
  ADD COLUMN `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `attachment` VARCHAR(191) NULL,
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `updatedById` INTEGER NULL;
CREATE INDEX `Expense_expenseCategoryId_idx` ON `Expense`(`expenseCategoryId`);
CREATE INDEX `Expense_expenseDate_idx` ON `Expense`(`expenseDate`);
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_expenseCategoryId_fkey` FOREIGN KEY (`expenseCategoryId`) REFERENCES `ExpenseCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Staff and permissions
CREATE TABLE `StaffRole` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `StaffRole_name_key`(`name`),
  INDEX `StaffRole_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Permission` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Permission_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RolePermission` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `roleId` INTEGER NOT NULL,
  `permissionId` INTEGER NOT NULL,
  UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `StaffRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `ShopStaff` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `userId` INTEGER NOT NULL,
  `roleId` INTEGER NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdById` INTEGER NULL,
  UNIQUE INDEX `ShopStaff_shopId_userId_key`(`shopId`, `userId`),
  INDEX `ShopStaff_shopId_idx`(`shopId`),
  INDEX `ShopStaff_userId_idx`(`userId`),
  INDEX `ShopStaff_roleId_idx`(`roleId`),
  INDEX `ShopStaff_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `ShopStaff` ADD CONSTRAINT `ShopStaff_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ShopStaff` ADD CONSTRAINT `ShopStaff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ShopStaff` ADD CONSTRAINT `ShopStaff_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `StaffRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `StaffPermission` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `staffId` INTEGER NOT NULL,
  `permissionId` INTEGER NOT NULL,
  UNIQUE INDEX `StaffPermission_staffId_permissionId_key`(`staffId`, `permissionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `StaffPermission` ADD CONSTRAINT `StaffPermission_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `ShopStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `StaffPermission` ADD CONSTRAINT `StaffPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Alerts
CREATE TABLE `Alert` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `type` ENUM('LOW_STOCK', 'OUT_OF_STOCK', 'DUPLICATE_IMEI', 'WARRANTY_EXPIRING', 'REPAIR_DELAYED', 'PENDING_DELIVERY', 'OLD_INVENTORY') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` VARCHAR(191) NOT NULL,
  `referenceType` VARCHAR(191) NULL,
  `referenceId` VARCHAR(191) NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `createdById` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Alert_shopId_idx`(`shopId`),
  INDEX `Alert_type_idx`(`type`),
  INDEX `Alert_isRead_idx`(`isRead`),
  INDEX `Alert_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Audit log expansion
ALTER TABLE `AuditLog`
  ADD COLUMN `shopId` INTEGER NULL,
  ADD COLUMN `referenceType` VARCHAR(191) NULL,
  ADD COLUMN `referenceId` VARCHAR(191) NULL,
  ADD COLUMN `oldValues` JSON NULL,
  ADD COLUMN `newValues` JSON NULL,
  ADD COLUMN `ipAddress` VARCHAR(191) NULL,
  ADD COLUMN `userAgent` VARCHAR(191) NULL;
CREATE INDEX `AuditLog_shopId_idx` ON `AuditLog`(`shopId`);
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
