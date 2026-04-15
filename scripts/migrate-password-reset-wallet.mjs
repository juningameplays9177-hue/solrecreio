import "dotenv/config";
import mysql from "mysql2/promise";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";
import { normalizeMysqlHostForNode } from "./normalize-mysql-host.mjs";

function parseMysqlUrl(connectionString) {
  const u = new URL(connectionString);
  const pathDb = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
  const database = decodeURIComponent(pathDb);
  return {
    host: normalizeMysqlHostForNode(u.hostname || "localhost"),
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
    database,
  };
}

const passwordResetSql = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pwd_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pwd_reset_token_hash (token_hash),
  INDEX idx_pwd_reset_user (user_id),
  INDEX idx_pwd_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const ledgerSql = `
CREATE TABLE IF NOT EXISTS cashback_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  kind ENUM('EARN', 'USE') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  source VARCHAR(48) NOT NULL,
  ref_type VARCHAR(32) NULL,
  ref_id INT UNSIGNED NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cashback_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cashback_ledger_user_created (user_id, created_at)
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
  const cfg = parseMysqlUrl(url);
  const conn = await mysql.createConnection(cfg);

  try {
    await conn.query(passwordResetSql);
    console.log("Tabela password_reset_tokens OK.");
    await conn.query(ledgerSql);
    console.log("Tabela cashback_ledger OK.");

    const [rows] = await conn.query(
      "SELECT COUNT(*) AS c FROM users WHERE cashback_balance > 100"
    );
    const c = Number(rows[0]?.c ?? 0);
    if (c > 0) {
      await conn.query(
        "UPDATE users SET cashback_balance = 100 WHERE cashback_balance > 100"
      );
      console.log(
        `Ajustados ${c} usuário(s) com saldo acima do teto de R$ 100,00.`
      );
    }
  } finally {
    await conn.end();
  }

  console.log("Migração password reset + carteira cashback concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
