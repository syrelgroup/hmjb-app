-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_positionId_fkey`;

-- DropIndex
DROP INDEX `User_positionId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` MODIFY `positionId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
