/*
  Warnings:

  - You are about to drop the column `absenceId` on the `permitabsence` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `permitabsence` DROP FOREIGN KEY `PermitAbsence_absenceId_fkey`;

-- DropIndex
DROP INDEX `PermitAbsence_absenceId_fkey` ON `permitabsence`;

-- AlterTable
ALTER TABLE `permitabsence` DROP COLUMN `absenceId`;
