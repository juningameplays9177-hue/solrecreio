import type { Pool, PoolConnection } from "mysql2/promise";
import { CASHBACK_WALLET_MAX_BRL } from "@/lib/cashback-wallet-constants";

/**
 * Garante `users.cashback_balance <=` teto (R$ 100). Idempotente.
 * Use ao ler o saldo ou antes de transações de cashback.
 */
export async function clampUserCashbackBalanceToMax(
  db: Pool | PoolConnection,
  userId: number
): Promise<void> {
  await db.query(
    `UPDATE users SET cashback_balance = LEAST(cashback_balance, ?)
     WHERE id = ? AND role = 'CLIENT' AND cashback_balance > ?`,
    [CASHBACK_WALLET_MAX_BRL, userId, CASHBACK_WALLET_MAX_BRL]
  );
}
