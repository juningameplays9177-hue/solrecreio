import type { Pool } from "mysql2/promise";

export const CASHBACK_REDEMPTION_MIN_AMOUNT = 10;

let redemptionSchemaReady = false;

export async function ensureCashbackRedemptionsSchema(pool: Pool): Promise<void> {
  if (redemptionSchemaReady) return;

  await pool.query(`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

  redemptionSchemaReady = true;
}

export function normalizeCashbackAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateCouponCode(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SOL-${stamp}-${rand}`;
}
