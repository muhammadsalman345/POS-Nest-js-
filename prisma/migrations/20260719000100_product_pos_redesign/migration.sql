-- Persist shop defaults collected during shop setup so products can inherit them.
ALTER TABLE `Shop` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'General Retail';
ALTER TABLE `Shop` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR';
ALTER TABLE `Shop` ADD COLUMN `taxPercentage` DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE `Shop` ADD COLUMN `inventoryTrackingEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Shop` ADD COLUMN `lowStockAlertsEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Shop` ADD COLUMN `allowNegativeStock` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Shop` ADD COLUMN `onlineSellingEnabled` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Shop` ADD COLUMN `cashOnDeliveryEnabled` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Shop` ADD COLUMN `defaultSaleMode` ENUM('OFFLINE_ONLY', 'ONLINE_MARKETPLACE', 'BOTH') NOT NULL DEFAULT 'OFFLINE_ONLY';
ALTER TABLE `Shop` ADD COLUMN `receiptSize` VARCHAR(191) NOT NULL DEFAULT '80mm';

-- Product-level fields kept intentionally narrow for staff product creation.
ALTER TABLE `Product` ADD COLUMN `sku` VARCHAR(191) NULL;
ALTER TABLE `Product` ADD COLUMN `compareAtPrice` DECIMAL(12, 2) NULL;
ALTER TABLE `Product` ADD COLUMN `offlineSaleEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Product` ADD COLUMN `discountType` VARCHAR(191) NOT NULL DEFAULT 'none';
ALTER TABLE `Product` ADD COLUMN `discountValue` DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE `Product` ADD COLUMN `lowStockAlert` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `Product` ADD COLUMN `useShopDefaultTax` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Product` ADD COLUMN `customTaxPercentage` DECIMAL(12, 2) NULL;
ALTER TABLE `Product` ADD COLUMN `serialNumberRequired` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Product` ADD COLUMN `imeiRequired` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `Product_sku_key` ON `Product`(`sku`);
CREATE INDEX `Product_sku_idx` ON `Product`(`sku`);
