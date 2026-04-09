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
    const [rows] = await pool.query<
      (RowDataPacket & {
        id: number;
        user_id: number;
        amount: string;
        status: string;
        original_filename: string | null;
        created_at: Date;
        user_name: string;
        user_email: string;
      })[]
    >(
      `SELECT i.id, i.user_id, i.amount, i.status, i.original_filename, i.created_at,
              u.name AS user_name, u.email AS user_email
       FROM cashback_invoices i
       JOIN users u ON u.id = i.user_id
       ORDER BY
         CASE WHEN i.status = 'PENDING' THEN 0 ELSE 1 END,
         i.created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ invoices: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao listar solicitações.") },
      { status: 500 }
    );
  }
}
