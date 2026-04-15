import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { ensureCashbackLedgerSchema } from "@/lib/cashback-ledger-schema";
import {
  ensureCashbackRedemptionsSchema,
  generateCouponCode,
} from "@/lib/cashback-redemptions";
import { notifyUser } from "@/lib/notify-client";
import { debitCashbackWallet } from "@/services/cashback-wallet-service";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";

export const runtime = "nodejs";

type Body = {
  action?: string;
  note?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
    }

    const action =
      body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
    if (!action) {
      return NextResponse.json(
        { error: 'Informe action: "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
    const pool = getPool();
    await ensureCashbackRedemptionsSchema(pool);
    await ensureCashbackLedgerSchema(pool);

    const conn = await pool.getConnection();
    let userIdForNotify = 0;
    let couponCode: string | null = null;
    let requestedAmount = 0;

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, user_id, amount, status
         FROM cashback_redemptions
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );
      const redemption = rows[0];
      if (!redemption) {
        await conn.rollback();
        return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
      }
      if (redemption.status !== "PENDING") {
        await conn.rollback();
        return NextResponse.json(
          { error: "Este pedido ja foi analisado." },
          { status: 409 }
        );
      }

      userIdForNotify = Number(redemption.user_id);
      requestedAmount = Number(redemption.amount);

      if (action === "approve") {
        const [userRows] = await conn.query<RowDataPacket[]>(
          "SELECT cashback_balance FROM users WHERE id = ? FOR UPDATE",
          [userIdForNotify]
        );
        const balance = Number(userRows[0]?.cashback_balance ?? 0);
        if (balance < requestedAmount) {
          await conn.rollback();
          return NextResponse.json(
            { error: "Saldo do cliente insuficiente para aprovar este resgate." },
            { status: 409 }
          );
        }

        for (let attempts = 0; attempts < 5; attempts += 1) {
          const candidate = generateCouponCode();
          try {
            await conn.query(
              `UPDATE cashback_redemptions
               SET status = 'APPROVED',
                   coupon_code = ?,
                   admin_note = ?,
                   reviewed_at = NOW(),
                   approved_at = NOW()
               WHERE id = ?`,
              [candidate, note || null, id]
            );
            couponCode = candidate;
            break;
          } catch (error) {
            if ((error as { code?: string }).code !== "ER_DUP_ENTRY" || attempts === 4) {
              throw error;
            }
          }
        }

        await debitCashbackWallet(conn, userIdForNotify, requestedAmount, {
          source: "redemption_approval",
          refType: "redemption",
          refId: id,
        });
      } else {
        await conn.query(
          `UPDATE cashback_redemptions
           SET status = 'REJECTED',
               admin_note = ?,
               reviewed_at = NOW(),
               rejected_at = NOW()
           WHERE id = ?`,
          [note || null, id]
        );
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    try {
      if (action === "approve" && couponCode) {
        await notifyUser(
          pool,
          userIdForNotify,
          "Resgate aprovado",
          `Seu pedido de resgate de R$ ${requestedAmount.toFixed(2)} foi aprovado. Seu cupom: ${couponCode}.`
        );
      } else {
        await notifyUser(
          pool,
          userIdForNotify,
          "Resgate recusado",
          note
            ? `Seu pedido de resgate foi recusado. Motivo: ${note}`
            : "Seu pedido de resgate foi recusado. Entre em contato se tiver duvidas."
        );
      }
    } catch (notifyError) {
      console.error("notifyUser:", notifyError);
    }

    return NextResponse.json({
      ok: true,
      action,
      couponCode,
      debited: action === "approve" ? requestedAmount : undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao processar resgate.") },
      { status: 500 }
    );
  }
}
