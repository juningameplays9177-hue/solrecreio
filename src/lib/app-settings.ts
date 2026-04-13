import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

const KEY = "cashback_percentage";

let appSettingsSchemaReady = false;

/** Garante tabela e valor padrão para leitura/escrita sem depender só de migração manual. */
export async function ensureAppSettingsSchema(pool: Pool): Promise<void> {
  if (appSettingsSchemaReady) return;
  try {
    await pool.query(`
CREATE TABLE IF NOT EXISTS app_settings (
  \`key\` VARCHAR(64) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);
    await pool.query(
      `INSERT IGNORE INTO app_settings (\`key\`, value) VALUES (?, '10')`,
      [KEY]
    );
    appSettingsSchemaReady = true;
  } catch (e) {
    console.warn("ensureAppSettingsSchema:", e);
  }
}

export async function getCashbackPercentage(pool: Pool): Promise<number> {
  try {
    await ensureAppSettingsSchema(pool);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT value FROM app_settings WHERE `key` = ? LIMIT 1",
      [KEY]
    );
    const raw = rows[0]?.value;
    const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) return 10;
    return Math.round(n * 100) / 100;
  } catch (e) {
    console.warn("getCashbackPercentage:", e);
    return 10;
  }
}

export function computeCashbackCredit(
  invoiceAmount: number,
  percentage: number
): number {
  const credit = (invoiceAmount * percentage) / 100;
  return Math.round(credit * 100) / 100;
}
