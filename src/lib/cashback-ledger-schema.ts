import type { Pool } from "mysql2/promise";

let schemaReady = false;

export async function ensureCashbackLedgerSchema(pool: Pool): Promise<void> {
  if (schemaReady) return;
  await pool.query(`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);
  schemaReady = true;
}
