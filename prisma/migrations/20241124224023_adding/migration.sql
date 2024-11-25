-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `nivel` ENUM('ADMIN', 'USER') NULL DEFAULT 'USER';
