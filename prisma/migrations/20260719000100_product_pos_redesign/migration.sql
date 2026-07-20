-- Persist shop defaults collected during shop setup so products can inherit them.
ALTER TABLE "Shop" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'General Retail';
ALTER TABLE "Shop" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PKR';
ALTER TABLE "Shop" ADD COLUMN "taxPercentage" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "inventoryTrackingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "lowStockAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN "onlineSellingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN "cashOnDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN "defaultSaleMode" TEXT NOT NULL DEFAULT 'OFFLINE_ONLY';
ALTER TABLE "Shop" ADD COLUMN "receiptSize" TEXT NOT NULL DEFAULT '80mm';

-- Product-level fields kept intentionally narrow for staff product creation.
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "compareAtPrice" DECIMAL;
ALTER TABLE "Product" ADD COLUMN "offlineSaleEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "discountType" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Product" ADD COLUMN "discountValue" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "lowStockAlert" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "useShopDefaultTax" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "customTaxPercentage" DECIMAL;
ALTER TABLE "Product" ADD COLUMN "serialNumberRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "imeiRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
