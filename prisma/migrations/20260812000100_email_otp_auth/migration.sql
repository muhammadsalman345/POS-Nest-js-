ALTER TABLE `User`
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

UPDATE `User`
SET `emailVerifiedAt` = NOW(3)
WHERE `email` IS NOT NULL;

CREATE TABLE `EmailOtp` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `purpose` VARCHAR(191) NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `User_emailVerifiedAt_idx` ON `User`(`emailVerifiedAt`);
CREATE INDEX `EmailOtp_userId_purpose_consumedAt_idx` ON `EmailOtp`(`userId`, `purpose`, `consumedAt`);
CREATE INDEX `EmailOtp_email_purpose_idx` ON `EmailOtp`(`email`, `purpose`);
CREATE INDEX `EmailOtp_expiresAt_idx` ON `EmailOtp`(`expiresAt`);

ALTER TABLE `EmailOtp`
  ADD CONSTRAINT `EmailOtp_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
