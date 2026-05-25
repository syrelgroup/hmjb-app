/*
  Warnings:

  - You are about to drop the column `debiturId` on the `billing` table. All the data in the column will be lost.
  - You are about to drop the column `paid_date` on the `billing` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `billing` DROP FOREIGN KEY `Billing_debiturId_fkey`;

-- DropIndex
DROP INDEX `Billing_debiturId_fkey` ON `billing`;

-- AlterTable
ALTER TABLE `billing` DROP COLUMN `debiturId`,
    DROP COLUMN `paid_date`,
    ADD COLUMN `mitraId` VARCHAR(191) NULL,
    ADD COLUMN `pkk` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `productId` VARCHAR(191) NULL,
    ADD COLUMN `submissionId` VARCHAR(191) NULL,
    ADD COLUMN `tung_bga` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tung_pkk` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_mitraId_fkey` FOREIGN KEY (`mitraId`) REFERENCES `Mitra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
