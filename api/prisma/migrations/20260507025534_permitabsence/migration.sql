/*
  Warnings:

  - Added the required column `userId` to the `PermitAbsence` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `permitabsence` DROP FOREIGN KEY `PermitAbsence_absenceId_fkey`;

-- DropIndex
DROP INDEX `PermitAbsence_absenceId_fkey` ON `permitabsence`;

-- AlterTable
ALTER TABLE `absence` ADD COLUMN `description` VARCHAR(191) NULL,
    MODIFY `absence_status` ENUM('HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT', 'LEMBUR', 'PULANG_CEPAT') NOT NULL DEFAULT 'HADIR';

-- AlterTable
ALTER TABLE `permitabsence` ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT', 'LEMBUR', 'PULANG_CEPAT') NOT NULL,
    MODIFY `absenceId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `PermitAbsence` ADD CONSTRAINT `PermitAbsence_absenceId_fkey` FOREIGN KEY (`absenceId`) REFERENCES `Absence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermitAbsence` ADD CONSTRAINT `PermitAbsence_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
