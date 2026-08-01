-- Add optional per-shop categories while keeping existing global categories.
ALTER TABLE `Category` ADD COLUMN `shopId` INTEGER NULL;
CREATE INDEX `Category_shopId_idx` ON `Category`(`shopId`);
ALTER TABLE `Category` ADD CONSTRAINT `Category_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
