/*
  Warnings:

  - Added the required column `mitraId` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `visit` ADD COLUMN `mitraId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_mitraId_fkey` FOREIGN KEY (`mitraId`) REFERENCES `Mitra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
