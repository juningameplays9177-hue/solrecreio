


-- =============================================================================
-- Sol do Recreio — instalação via phpMyAdmin (Hostinger ou outro MySQL)
-- =============================================================================
-- 1) hPanel → Bases de dados → phpMyAdmin
-- 2) À esquerda, clique no seu banco (ex.: u494944867_sol) — NÃO precisa criar
--    o banco de novo se a Hostinger já o criou.
-- 3) Separador "SQL" → cole este ficheiro inteiro → Executar
--
-- Se der erro "tabela já existe", normalmente pode ignorar (CREATE IF NOT EXISTS).
-- =============================================================================

SET NAMES utf8mb4;

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

CREATE TABLE IF NOT EXISTS app_settings (
  `key` VARCHAR(64) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_settings (`key`, value) VALUES ('cashback_percentage', '10');

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_unread (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cashback_invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credited_amount DECIMAL(10,2) NULL,
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

-- =============================================================================
-- Só use o bloco abaixo se JÁ tinha tabelas antigas (sem estas colunas).
-- Descomente linha a linha; se der "Duplicate column name", passe à seguinte.
-- =============================================================================
--
-- ALTER TABLE users ADD COLUMN cashback_balance DECIMAL(10,2) NOT NULL DEFAULT 0;
-- ALTER TABLE cashback_invoices ADD COLUMN credited_amount DECIMAL(10,2) NULL DEFAULT NULL AFTER amount;
--
-- CREATE TABLE IF NOT EXISTS app_settings (...); -- já está acima
-- CREATE TABLE IF NOT EXISTS notifications (...);   -- já está acima

-- =============================================================================
-- Utilizador admin: não insira senha em texto puro. Opções:
--   • Página /cadastro (cliente), ou
--   • No PC: DATABASE_URL com MySQL remoto da Hostinger → npm run db:seed-admin
-- =============================================================================
