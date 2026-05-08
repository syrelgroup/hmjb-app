-- DropForeignKey
ALTER TABLE `permitabsence` DROP FOREIGN KEY `PermitAbsence_userId_fkey`;

-- DropIndex
DROP INDEX `PermitAbsence_userId_fkey` ON `permitabsence`;

-- AlterTable
ALTER TABLE `permitabsence` ADD COLUMN `approverById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `PermitAbsence` ADD CONSTRAINT `PermitAbsence_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermitAbsence` ADD CONSTRAINT `PermitAbsence_approverById_fkey` FOREIGN KEY (`approverById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
