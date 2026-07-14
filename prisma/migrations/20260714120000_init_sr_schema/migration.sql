-- CreateTable sr_User
CREATE TABLE IF NOT EXISTS `sr_User` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(11) NULL,
    `phone` VARCHAR(32) NULL,
    `role` ENUM('ADMIN', 'CLIENT') NOT NULL,
    `cashback_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sr_User_email_key`(`email`),
    UNIQUE INDEX `sr_User_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_Purchase
CREATE TABLE IF NOT EXISTS `sr_Purchase` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `credited_amount` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `file_path` VARCHAR(512) NULL,
    `original_filename` VARCHAR(255) NULL,
    `admin_note` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reviewed_at` TIMESTAMP(0) NULL,

    INDEX `idx_sr_purchase_status`(`status`),
    INDEX `idx_sr_purchase_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_CashbackRedemption
CREATE TABLE IF NOT EXISTS `sr_CashbackRedemption` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'USED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `coupon_code` VARCHAR(64) NULL,
    `admin_note` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reviewed_at` TIMESTAMP(0) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `rejected_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `sr_CashbackRedemption_coupon_code_key`(`coupon_code`),
    INDEX `idx_sr_cashback_redemption_user`(`user_id`),
    INDEX `idx_sr_cashback_redemption_status`(`status`),
    INDEX `idx_sr_cashback_redemption_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_AppSetting
CREATE TABLE IF NOT EXISTS `sr_AppSetting` (
    `key` VARCHAR(64) NOT NULL,
    `value` TEXT NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_Notification
CREATE TABLE IF NOT EXISTS `sr_Notification` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `read_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sr_notification_user`(`user_id`),
    INDEX `idx_sr_notification_unread`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_PasswordResetToken
CREATE TABLE IF NOT EXISTS `sr_PasswordResetToken` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sr_pwd_reset_token_hash`(`token_hash`),
    INDEX `idx_sr_pwd_reset_user`(`user_id`),
    INDEX `idx_sr_pwd_reset_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable sr_CashbackLedger
CREATE TABLE IF NOT EXISTS `sr_CashbackLedger` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `kind` ENUM('EARN', 'USE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balance_after` DECIMAL(10, 2) NOT NULL,
    `source` VARCHAR(48) NOT NULL,
    `ref_type` VARCHAR(32) NULL,
    `ref_id` INTEGER UNSIGNED NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sr_cashback_ledger_user_created`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (idempotente: ignora se já existir)
-- sr_Purchase
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sr_Purchase' AND CONSTRAINT_NAME = 'sr_Purchase_user_id_fkey');
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE `sr_Purchase` ADD CONSTRAINT `sr_Purchase_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sr_User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sr_CashbackRedemption
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sr_CashbackRedemption' AND CONSTRAINT_NAME = 'sr_CashbackRedemption_user_id_fkey');
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE `sr_CashbackRedemption` ADD CONSTRAINT `sr_CashbackRedemption_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sr_User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sr_Notification
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sr_Notification' AND CONSTRAINT_NAME = 'sr_Notification_user_id_fkey');
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE `sr_Notification` ADD CONSTRAINT `sr_Notification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sr_User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sr_PasswordResetToken
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sr_PasswordResetToken' AND CONSTRAINT_NAME = 'sr_PasswordResetToken_user_id_fkey');
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE `sr_PasswordResetToken` ADD CONSTRAINT `sr_PasswordResetToken_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sr_User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sr_CashbackLedger
SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sr_CashbackLedger' AND CONSTRAINT_NAME = 'sr_CashbackLedger_user_id_fkey');
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE `sr_CashbackLedger` ADD CONSTRAINT `sr_CashbackLedger_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sr_User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO `sr_AppSetting` (`key`, value) VALUES ('cashback_percentage', '10');
