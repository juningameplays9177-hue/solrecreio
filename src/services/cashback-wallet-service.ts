import type { Pool, PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { clampUserCashbackBalanceToMax } from "@/lib/clamp-user-cashback-balance";
import { ensureCashbackLedgerSchema } from "@/lib/cashback-ledger-schema";
import {
  CASHBACK_WALLET_MAX_BRL,
  roundMoneyBrl,
} from "@/lib/cashback-wallet-constants";

export type LedgerEntry = {
  id: number;
  kind: "EARN" | "USE";
  amount: number;
  balanceAfter: number;
  source: string;
  refType: string | null;
  refId: number | null;
  metadata: unknown;
  createdAt: string;
};

type CreditOpts = {
  source: string;
  refType?: string | null;
  refId?: number | null;
  metadata?: Record<string, unknown> | null;
};

type DebitOpts = {
  source: string;
  refType?: string | null;
  refId?: number | null;
  metadata?: Record<string, unknown> | null;
};

async function insertLedger(
  conn: PoolConnection,
  userId: number,
  kind: "EARN" | "USE",
  amount: number,
  balanceAfter: number,
  opts: CreditOpts | DebitOpts
): Promise<void> {
  const metaJson =
    opts.metadata && Object.keys(opts.metadata).length > 0
      ? JSON.stringify(opts.metadata)
      : null;
  await conn.query<ResultSetHeader>(
    `INSERT INTO cashback_ledger
     (user_id, kind, amount, balance_after, source, ref_type, ref_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      kind,
      amount.toFixed(2),
      balanceAfter.toFixed(2),
      opts.source,
      opts.refType ?? null,
      opts.refId ?? null,
      metaJson,
    ]
  );
}

/**
 * Credita cashback respeitando o teto de R$ 100. Deve ser chamado dentro de transação.
 */
export async function creditCashbackCapped(
  conn: PoolConnection,
  userId: number,
  rawCredit: number,
  opts: CreditOpts
): Promise<{ credited: number; balanceAfter: number; capped: boolean }> {
  const want = roundMoneyBrl(rawCredit);
  if (!Number.isFinite(want) || want <= 0) {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT cashback_balance FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    let balance = roundMoneyBrl(Number(rows[0]?.cashback_balance ?? 0));
    if (balance > CASHBACK_WALLET_MAX_BRL) {
      await conn.query(
        `UPDATE users SET cashback_balance = ? WHERE id = ?`,
        [CASHBACK_WALLET_MAX_BRL.toFixed(2), userId]
      );
      balance = CASHBACK_WALLET_MAX_BRL;
    }
    return { credited: 0, balanceAfter: balance, capped: false };
  }

  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT cashback_balance FROM users WHERE id = ? FOR UPDATE",
    [userId]
  );
  let balance = roundMoneyBrl(Number(rows[0]?.cashback_balance ?? 0));
  if (balance > CASHBACK_WALLET_MAX_BRL) {
    await conn.query(
      `UPDATE users SET cashback_balance = ? WHERE id = ?`,
      [CASHBACK_WALLET_MAX_BRL.toFixed(2), userId]
    );
    balance = CASHBACK_WALLET_MAX_BRL;
  }
  const room = roundMoneyBrl(CASHBACK_WALLET_MAX_BRL - balance);
  const credited = roundMoneyBrl(Math.min(want, Math.max(0, room)));
  const capped = want > credited && credited < want;
  const balanceAfter = roundMoneyBrl(balance + credited);

  if (credited > 0) {
    await conn.query(
      `UPDATE users SET cashback_balance = cashback_balance + ? WHERE id = ?`,
      [credited.toFixed(2), userId]
    );
    await insertLedger(conn, userId, "EARN", credited, balanceAfter, opts);
  }

  return { credited, balanceAfter, capped };
}

/**
 * Debita saldo da carteira. Deve ser chamado dentro de transação.
 */
export async function debitCashbackWallet(
  conn: PoolConnection,
  userId: number,
  rawAmount: number,
  opts: DebitOpts
): Promise<{ debited: number; balanceAfter: number }> {
  const amount = roundMoneyBrl(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor inválido para uso de cashback.");
  }

  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT cashback_balance FROM users WHERE id = ? FOR UPDATE",
    [userId]
  );
  let balance = roundMoneyBrl(Number(rows[0]?.cashback_balance ?? 0));
  if (balance > CASHBACK_WALLET_MAX_BRL) {
    await conn.query(
      `UPDATE users SET cashback_balance = ? WHERE id = ?`,
      [CASHBACK_WALLET_MAX_BRL.toFixed(2), userId]
    );
    balance = CASHBACK_WALLET_MAX_BRL;
  }
  if (balance < amount) {
    throw new Error("Saldo insuficiente.");
  }

  const balanceAfter = roundMoneyBrl(balance - amount);
  await conn.query(
    `UPDATE users SET cashback_balance = cashback_balance - ? WHERE id = ?`,
    [amount.toFixed(2), userId]
  );
  await insertLedger(conn, userId, "USE", amount, balanceAfter, opts);
  return { debited: amount, balanceAfter };
}

export async function getCashbackWalletSummary(
  pool: Pool,
  userId: number
): Promise<{
  saldoCashback: number;
  limiteMaximo: number;
  espacoDisponivelParaGanhos: number;
  historicoCashback: LedgerEntry[];
  historicoUsoCashback: LedgerEntry[];
}> {
  await ensureCashbackLedgerSchema(pool);
  await clampUserCashbackBalanceToMax(pool, userId);

  const [uRows] = await pool.query<RowDataPacket[]>(
    "SELECT cashback_balance FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const saldo = roundMoneyBrl(Number(uRows[0]?.cashback_balance ?? 0));

  const mapRow = (
    r: RowDataPacket & {
      id: number;
      kind: string;
      amount: string;
      balance_after: string;
      source: string;
      ref_type: string | null;
      ref_id: number | null;
      metadata: unknown;
      created_at: Date;
    }
  ): LedgerEntry => ({
    id: Number(r.id),
    kind: r.kind === "USE" ? "USE" : "EARN",
    amount: roundMoneyBrl(Number(r.amount)),
    balanceAfter: roundMoneyBrl(Number(r.balance_after)),
    source: String(r.source),
    refType: r.ref_type == null ? null : String(r.ref_type),
    refId: r.ref_id == null ? null : Number(r.ref_id),
    metadata: r.metadata ?? null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  });

  const rowSql = `SELECT id, kind, amount, balance_after, source, ref_type, ref_id, metadata, created_at
     FROM cashback_ledger
     WHERE user_id = ? AND kind = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 100`;

  const [earnRows] = await pool.query<
    (RowDataPacket & {
      id: number;
      kind: string;
      amount: string;
      balance_after: string;
      source: string;
      ref_type: string | null;
      ref_id: number | null;
      metadata: unknown;
      created_at: Date;
    })[]
  >(rowSql, [userId, "EARN"]);

  const [useRows] = await pool.query<
    (RowDataPacket & {
      id: number;
      kind: string;
      amount: string;
      balance_after: string;
      source: string;
      ref_type: string | null;
      ref_id: number | null;
      metadata: unknown;
      created_at: Date;
    })[]
  >(rowSql, [userId, "USE"]);

  return {
    saldoCashback: saldo,
    limiteMaximo: CASHBACK_WALLET_MAX_BRL,
    espacoDisponivelParaGanhos: roundMoneyBrl(CASHBACK_WALLET_MAX_BRL - saldo),
    historicoCashback: earnRows.map(mapRow),
    historicoUsoCashback: useRows.map(mapRow),
  };
}
