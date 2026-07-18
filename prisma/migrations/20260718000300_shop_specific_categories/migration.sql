-- Add optional per-shop categories while keeping existing global categories.
ALTER TABLE "Category" ADD COLUMN "shopId" INTEGER;

PRAGMA foreign_keys=off;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopId" INTEGER,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Category_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("createdAt", "createdById", "deletedAt", "description", "id", "image", "name", "parentId", "shopId", "slug", "status", "updatedAt", "updatedById")
SELECT "createdAt", "createdById", "deletedAt", "description", "id", "image", "name", "parentId", "shopId", "slug", "status", "updatedAt", "updatedById" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_shopId_idx" ON "Category"("shopId");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_status_idx" ON "Category"("status");
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=on;
