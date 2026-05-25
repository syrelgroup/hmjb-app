-- AlterTable
ALTER TABLE `billing` ADD COLUMN `col` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `insurance` ADD COLUMN `files` TEXT NULL;

-- AlterTable
ALTER TABLE `mitra` MODIFY `file` TEXT NULL;

-- AlterTable
ALTER TABLE `payoffice` ADD COLUMN `files` TEXT NULL;
