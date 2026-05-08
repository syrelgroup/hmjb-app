/*
  Warnings:

  - You are about to drop the column `status` on the `payroll` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `absence` MODIFY `absence_status` ENUM('ALPHA', 'HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT', 'LEMBUR', 'PULANG_CEPAT') NOT NULL DEFAULT 'HADIR';

-- AlterTable
ALTER TABLE `insentif` ADD COLUMN `file` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payroll` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `permitabsence` MODIFY `type` ENUM('ALPHA', 'HADIR', 'TERLAMBAT', 'CUTI', 'PERDIN', 'SAKIT', 'LEMBUR', 'PULANG_CEPAT') NOT NULL;
