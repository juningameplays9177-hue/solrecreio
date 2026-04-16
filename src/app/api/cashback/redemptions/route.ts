import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
import {
  CASHBACK_REDEMPTION_MIN_AMOUNT,
  ensureCashbackRedemptionsSchema,
  normalizeCashbackAmount,
} from "@/lib/cashback-redemptions";
import { clampUserCashbackBalanceToMax } from "@/lib/clamp-user-cashback-balance";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const session = await getSessionFromCookies();
    const denied = denyUnlessClientWithCompleteProfile(session);
    if (denied) return denied;

    const client = asClientSessionReady(session);
    const userId = Number(client.sub);
    const pool = getPool();

    await ensureCashbackRedemptionsSchema(pool);
    await clampUserCashbackBalanceToMax(pool, userId);

    const [rows] = await pool.query<
      (RowDataPacket & {
        id: number;
        amount: string;
        status: string;
        coupon_code: string | null;
        admin_note: string | null;
        created_at: Date;
        reviewed_at: Date | null;
      })[]
    >(
      `SELECT id, amount, status, coupon_code, admin_note, created_at, reviewed_at
       FROM cashback_redemptions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json({
      redemptions: rows.map((row) => ({
        id: Number(row.id),
        amount: Number(row.amount),
        status: String(row.status),
        coupon_code: row.coupon_code ? String(row.coupon_code) : null,
        admin_note: row.admin_note ? String(row.admin_note) : null,
        created_at:
          row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        reviewed_at:
          row.reviewed_at instanceof Date
            ? row.reviewed_at.toISOString()
            : row.reviewed_at
              ? String(row.reviewed_at)
              : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao carregar resgates.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const session = await getSessionFromCookies();
    const denied = denyUnlessClientWithCompleteProfile(session);
    if (denied) return denied;

    const client = asClientSessionReady(session);
    const userId = Number(client.sub);

    let body: { amount?: number | string };
    try {
      body = (await request.json()) as { amount?: number | string };
    } catch {
      return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
    }

    const raw =
      typeof body.amount === "string"
        ? body.amount.replace(",", ".").trim()
        : typeof body.amount === "number"
          ? String(body.amount)
          : "";
    const amount = normalizeCashbackAmount(Number(raw));

    if (!Number.isFinite(amount) || amount < CASHBACK_REDEMPTION_MIN_AMOUNT) {
      return NextResponse.json(
        { error: `O resgate minimo e de R$ ${CASHBACK_REDEMPTION_MIN_AMOUNT.toFixed(2)}.` },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureCashbackRedemptionsSchema(pool);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await clampUserCashbackBalanceToMax(conn, userId);

      const [userRows] = await conn.query<RowDataPacket[]>(
        "SELECT cashback_balance FROM users WHERE id = ? FOR UPDATE",
        [userId]
      );
      const balance = Number(userRows[0]?.cashback_balance ?? 0);
      if (balance < amount) {
        await conn.rollback();
        return NextResponse.json({ error: "Saldo insuficiente para esse resgate." }, { status: 400 });
      }

      const [pendingRows] = await conn.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(amount), 0) AS reserved_amount FROM cashback_redemptions WHERE user_id = ? AND status = 'PENDING' FOR UPDATE",
        [userId]
      );
      const reserved = Number(pendingRows[0]?.reserved_amount ?? 0);
      if (balance - reserved < amount) {
        await conn.rollback();
        return NextResponse.json(
          { error: "Voce ja possui resgates pendentes consumindo esse saldo." },
          { status: 409 }
        );
      }

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO cashback_redemptions (user_id, amount, status)
         VALUES (?, ?, 'PENDING')`,
        [userId, amount.toFixed(2)]
      );

      await conn.commit();
      return NextResponse.json({
        ok: true,
        id: result.insertId,
        message: "Pedido de resgate enviado para aprovacao.",
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao solicitar resgate.") },
      { status: 500 }
    );
  }
}
