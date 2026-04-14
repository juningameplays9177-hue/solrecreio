import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { computeCashbackCredit, getCashbackPercentage } from "@/lib/app-settings";
import { notifyUser } from "@/lib/notify-client";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";

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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const action =
      body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
    if (!action) {
      return NextResponse.json(
        { error: 'Informe action: "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const note =
      typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";

    const pool = getPool();
    const pct = await getCashbackPercentage(pool);

    const conn = await pool.getConnection();
    let userIdForNotify = 0;
    let approvedCredit = 0;
    let invoiceAmount = 0;

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT id, user_id, amount, status FROM cashback_invoices WHERE id = ? FOR UPDATE",
        [id]
      );
      const inv = rows[0];
      if (!inv) {
        await conn.rollback();
        return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
      }
      if (inv.status !== "PENDING") {
        await conn.rollback();
        return NextResponse.json(
          { error: "Esta solicitação já foi analisada." },
          { status: 409 }
        );
      }

      const userId = Number(inv.user_id);
      userIdForNotify = userId;
      invoiceAmount = Number(inv.amount);

      if (action === "approve") {
        const credit = computeCashbackCredit(invoiceAmount, pct);
        approvedCredit = credit;

        await conn.query(
          `UPDATE users SET cashback_balance = cashback_balance + ? WHERE id = ?`,
          [credit, userId]
        );

        await conn.query(
          `UPDATE cashback_invoices SET status = 'APPROVED', credited_amount = ?, reviewed_at = NOW(), admin_note = ?
           WHERE id = ?`,
          [credit, note || null, id]
        );
      } else {
        await conn.query(
          `UPDATE cashback_invoices SET status = 'REJECTED', reviewed_at = NOW(), admin_note = ?
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
      if (action === "approve") {
        await notifyUser(
          pool,
          userIdForNotify,
          "Cashback aprovado",
          `Sua nota fiscal foi aprovada. Valor informado: R$ ${invoiceAmount.toFixed(2)}. Cashback de ${pct}% creditado: R$ ${approvedCredit.toFixed(2)}.`
        );
      } else {
        await notifyUser(
          pool,
          userIdForNotify,
          "Nota fiscal não aprovada",
          note
            ? `Sua solicitação foi recusada. Motivo: ${note}`
            : "Sua solicitação de cashback foi recusada. Entre em contato se tiver dúvidas."
        );
      }
    } catch (ne) {
      console.error("notifyUser:", ne);
    }

    return NextResponse.json({
      ok: true,
      action,
      cashbackPercentage: pct,
      credited: action === "approve" ? approvedCredit : undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao processar.") },
      { status: 500 }
    );
  }
}
