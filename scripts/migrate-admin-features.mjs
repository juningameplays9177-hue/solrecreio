import "dotenv/config";
import mysql from "mysql2/promise";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";

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

  await conn.query(settingsSql);
  await conn.query(
    `INSERT IGNORE INTO app_settings (\`key\`, value) VALUES ('cashback_percentage', '10')`
  );

  await conn.query(notificationsSql);

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
  console.log("Migração admin + notificações concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
