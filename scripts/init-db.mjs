import "dotenv/config";
import mysql from "mysql2/promise";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";
import { normalizeMysqlHostForNode } from "./normalize-mysql-host.mjs";

const usersSql = `
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
`;

const settingsSql = `
CREATE TABLE IF NOT EXISTS app_settings (
  \`key\` VARCHAR(64) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const notificationsSql = `
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
`;

const invoicesSql = `
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
`;

const redemptionsSql = `
CREATE TABLE IF NOT EXISTS cashback_redemptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'USED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  coupon_code VARCHAR(64) NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  CONSTRAINT fk_cashback_redemptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_cashback_redemptions_coupon (coupon_code),
  INDEX idx_cashback_redemptions_user (user_id),
  INDEX idx_cashback_redemptions_status (status),
  INDEX idx_cashback_redemptions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  const url = resolveDatabaseUrlFromEnv();
  if (!url) {
    console.error(
      "Defina DATABASE_URL ou MYSQL_HOST + MYSQL_USER + MYSQL_DATABASE no .env"
    );
    process.exit(1);
  }

  const u = new URL(url);
  const dbName = decodeURIComponent(u.pathname.replace(/^\//, "").split("/")[0] ?? "");
  if (!dbName || !/^[a-zA-Z0-9_]+$/.test(dbName)) {
    console.error(
      "Nome do banco em DATABASE_URL inválido (use apenas letras, números e _)."
    );
    process.exit(1);
  }

  const base = {
    host: normalizeMysqlHostForNode(u.hostname || "localhost"),
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
  };

  const conn = await mysql.createConnection(base);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${dbName}\``);
  await conn.query(usersSql);
  await conn.query(settingsSql);
  await conn.query(
    `INSERT IGNORE INTO app_settings (\`key\`, value) VALUES ('cashback_percentage', '10')`
  );
  await conn.query(notificationsSql);
  await conn.query(invoicesSql);
  await conn.query(redemptionsSql);
  await conn.end();
  console.log(`Banco "${dbName}", users, cashback_invoices e cashback_redemptions criados ou já existentes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
