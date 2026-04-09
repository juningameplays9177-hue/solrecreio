import "dotenv/config";
import mysql from "mysql2/promise";

function parseMysqlUrl(connectionString) {
  const u = new URL(connectionString);
  const pathDb = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
  const database = decodeURIComponent(pathDb);
  return {
    host: u.hostname || "localhost",
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
    database,
  };
}

const invoicesSql = `
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
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Defina DATABASE_URL no .env");
    process.exit(1);
  }
  const cfg = parseMysqlUrl(url);
  const conn = await mysql.createConnection(cfg);

  try {
    await conn.query(
      "ALTER TABLE users ADD COLUMN cashback_balance DECIMAL(10,2) NOT NULL DEFAULT 0"
    );
    console.log("Coluna users.cashback_balance adicionada.");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("Coluna users.cashback_balance já existe.");
    } else {
      throw e;
    }
  }

  await conn.query(invoicesSql);
  console.log("Tabela cashback_invoices OK.");

  try {
    await conn.query(
      "ALTER TABLE cashback_invoices ADD COLUMN credited_amount DECIMAL(10,2) NULL DEFAULT NULL AFTER amount"
    );
    console.log("Coluna credited_amount adicionada em cashback_invoices.");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("Coluna credited_amount já existe.");
    } else {
      throw e;
    }
  }

  await conn.end();
  console.log("Migração cashback concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
