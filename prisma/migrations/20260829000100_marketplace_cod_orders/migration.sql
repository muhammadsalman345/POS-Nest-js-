CREATE TABLE `MarketplaceOrder` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `shopId` INTEGER NOT NULL,
  `orderNo` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'COD',
  `customerName` VARCHAR(191) NOT NULL,
  `customerPhone` VARCHAR(191) NOT NULL,
  `customerEmail` VARCHAR(191) NULL,
  `deliveryAddress` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL DEFAULT 'Pakistan',
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `notes` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `cancelledAt` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,

  UNIQUE INDEX `MarketplaceOrder_orderNo_key`(`orderNo`),
  INDEX `MarketplaceOrder_shopId_idx`(`shopId`),
  INDEX `MarketplaceOrder_status_idx`(`status`),
  INDEX `MarketplaceOrder_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MarketplaceOrderItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `orderId` INTEGER NOT NULL,
  `productId` INTEGER NOT NULL,
  `productName` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(191) NULL,
  `quantity` INTEGER NOT NULL DEFAULT 1,
  `unitPrice` DECIMAL(12, 2) NOT NULL,
  `totalPrice` DECIMAL(12, 2) NOT NULL,

  INDEX `MarketplaceOrderItem_orderId_idx`(`orderId`),
  INDEX `MarketplaceOrderItem_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MarketplaceOrder`
  ADD CONSTRAINT `MarketplaceOrder_shopId_fkey`
  FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MarketplaceOrderItem`
  ADD CONSTRAINT `MarketplaceOrderItem_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `MarketplaceOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MarketplaceOrderItem`
  ADD CONSTRAINT `MarketplaceOrderItem_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
