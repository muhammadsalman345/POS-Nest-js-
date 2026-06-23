-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'SELLER', 'BUYER') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `paymentRequired` BOOLEAN NOT NULL DEFAULT false,
    `paymentAmount` DECIMAL(12, 2) NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` INTEGER NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Shop_ownerId_idx`(`ownerId`),
    INDEX `Shop_approvalStatus_idx`(`approvalStatus`),
    INDEX `Shop_city_area_idx`(`city`, `area`),
    INDEX `Shop_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seller` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fatherName` VARCHAR(191) NULL,
    `cnic` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `cnicFrontImage` VARCHAR(191) NULL,
    `cnicBackImage` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Seller_shopId_idx`(`shopId`),
    INDEX `Seller_cnic_idx`(`cnic`),
    INDEX `Seller_phone_idx`(`phone`),
    INDEX `Seller_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `cnic` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Customer_userId_key`(`userId`),
    INDEX `Customer_phone_idx`(`phone`),
    INDEX `Customer_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `variant` VARCHAR(191) NULL,
    `imei1` VARCHAR(191) NOT NULL,
    `imei2` VARCHAR(191) NULL,
    `storage` VARCHAR(191) NULL,
    `ram` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `condition` ENUM('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED') NOT NULL,
    `batteryHealth` INTEGER NULL,
    `accessories` VARCHAR(191) NULL,
    `purchasePrice` DECIMAL(12, 2) NOT NULL,
    `expectedSalePrice` DECIMAL(12, 2) NULL,
    `finalSalePrice` DECIMAL(12, 2) NULL,
    `onlineSaleEnabled` BOOLEAN NOT NULL DEFAULT false,
    `sourceType` ENUM('CUSTOMER', 'SUPPLIER', 'OTHER_SHOP') NOT NULL DEFAULT 'CUSTOMER',
    `sourceName` VARCHAR(191) NULL,
    `sourcePhone` VARCHAR(191) NULL,
    `sourceCnic` VARCHAR(191) NULL,
    `sourceAddress` VARCHAR(191) NULL,
    `supplierBusinessName` VARCHAR(191) NULL,
    `supplierContactPerson` VARCHAR(191) NULL,
    `supplierPhone` VARCHAR(191) NULL,
    `supplierAddress` VARCHAR(191) NULL,
    `status` ENUM('IN_STOCK', 'RESERVED', 'SOLD', 'RETURNED', 'DAMAGED', 'UNDER_REPAIR') NOT NULL DEFAULT 'IN_STOCK',
    `ptaStatus` ENUM('APPROVED', 'NOT_APPROVED', 'PATCHED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `description` VARCHAR(191) NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Product_imei1_key`(`imei1`),
    UNIQUE INDEX `Product_imei2_key`(`imei2`),
    INDEX `Product_shopId_idx`(`shopId`),
    INDEX `Product_sellerId_idx`(`sellerId`),
    INDEX `Product_brand_model_idx`(`brand`, `model`),
    INDEX `Product_status_idx`(`status`),
    INDEX `Product_condition_idx`(`condition`),
    INDEX `Product_ptaStatus_idx`(`ptaStatus`),
    INDEX `Product_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `ProductImage_productId_idx`(`productId`),
    INDEX `ProductImage_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `purchasePrice` DECIMAL(12, 2) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Purchase_productId_key`(`productId`),
    UNIQUE INDEX `Purchase_receiptNumber_key`(`receiptNumber`),
    INDEX `Purchase_shopId_idx`(`shopId`),
    INDEX `Purchase_sellerId_idx`(`sellerId`),
    INDEX `Purchase_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `customerId` INTEGER NOT NULL,
    `salePrice` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` ENUM('CASH', 'BANK', 'JAZZCASH', 'EASYPAISA', 'CARD') NOT NULL,
    `saleType` ENUM('ONLINE', 'OFFLINE') NOT NULL,
    `warrantyDays` INTEGER NOT NULL DEFAULT 0,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Sale_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Sale_shopId_idx`(`shopId`),
    INDEX `Sale_productId_idx`(`productId`),
    INDEX `Sale_customerId_idx`(`customerId`),
    INDEX `Sale_saleType_idx`(`saleType`),
    INDEX `Sale_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Expense_shopId_idx`(`shopId`),
    INDEX `Expense_productId_idx`(`productId`),
    INDEX `Expense_type_idx`(`type`),
    INDEX `Expense_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NULL,
    `oldData` LONGTEXT NULL,
    `newData` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_module_idx`(`module`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Shop` ADD CONSTRAINT `Shop_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seller` ADD CONSTRAINT `Seller_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
