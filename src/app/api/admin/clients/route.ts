import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

export async function GET() {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503 });
    }
    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.cpf, u.phone, u.cashback_balance, u.created_at,
              (SELECT COUNT(*) FROM cashback_invoices c WHERE c.user_id = u.id) AS invoices_count
       FROM users u
       WHERE u.role = 'CLIENT'
       ORDER BY u.name ASC`
    );

    return NextResponse.json({ clients: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao listar clientes.") },
      { status: 500 }
    );
  }
}
