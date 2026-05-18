/*
  Warnings:

  - The values [DISETUJUI,DITOLAK,SELESAI] on the enum `Submission_approve_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `submission` ADD COLUMN `doc_status` ENUM('PENDING', 'DITERIMA', 'DIPINJAM', 'DIKEMBALIKAN') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `flagging_status` ENUM('PENDING', 'FLAGGING', 'NON_PENSIUNAN') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `payOfficeId` VARCHAR(191) NULL,
    MODIFY `approve_status` ENUM('PENDING', 'AKTIF', 'LUNAS', 'PASIF', 'BREAK') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `PayOffice` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_payOfficeId_fkey` FOREIGN KEY (`payOfficeId`) REFERENCES `PayOffice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
