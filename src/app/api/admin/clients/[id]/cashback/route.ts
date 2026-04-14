import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
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
    const userId = Number(idParam);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pool = getPool();
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, cpf, phone, cashback_balance FROM users WHERE id = ? AND role = 'CLIENT' LIMIT 1",
      [userId]
    );
    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const [invoices] = await pool.query<RowDataPacket[]>(
      `SELECT id, amount, credited_amount, status, original_filename, created_at, reviewed_at, admin_note
       FROM cashback_invoices WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ user, invoices });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao carregar.") },
      { status: 500 }
    );
  }
}
