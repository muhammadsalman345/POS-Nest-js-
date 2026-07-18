ALTER TABLE `User`
  ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `refreshTokenHash` VARCHAR(191) NULL,
  ADD COLUMN `refreshTokenExpiresAt` DATETIME(3) NULL;

CREATE INDEX `User_refreshTokenExpiresAt_idx` ON `User`(`refreshTokenExpiresAt`);
