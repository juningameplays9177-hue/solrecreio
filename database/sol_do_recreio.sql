-- Banco e tabelas do projeto "Sol do Recreio"
--
-- Novo ambiente: npm.cmd run db:init
-- Banco já existente sem cashback: npm.cmd run db:migrate-cashback

CREATE DATABASE IF NOT EXISTS sol_do_recreio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sol_do_recreio;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NULL,
  phone VARCHAR(32) NULL,
  role ENUM('ADMIN', 'CLIENT') NOT NULL,
  cashback_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_email (email),
  UNIQUE KEY uniq_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cashback_invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  file_path VARCHAR(512) NULL,
  original_filename VARCHAR(255) NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  CONSTRAINT fk_cashback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cashback_status (status),
  INDEX idx_cashback_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
