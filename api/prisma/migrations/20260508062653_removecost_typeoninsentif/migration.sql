/*
  Warnings:

  - You are about to drop the column `costTypeId` on the `insentif` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `insentif` DROP FOREIGN KEY `Insentif_costTypeId_fkey`;

-- DropIndex
DROP INDEX `Insentif_costTypeId_fkey` ON `insentif`;

-- AlterTable
ALTER TABLE `insentif` DROP COLUMN `costTypeId`;
