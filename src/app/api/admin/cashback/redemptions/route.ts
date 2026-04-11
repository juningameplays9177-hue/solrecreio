import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { ensureCashbackRedemptionsSchema } from "@/lib/cashback-redemptions";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503 });
    }

    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const pool = getPool();
    await ensureCashbackRedemptionsSchema(pool);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.user_id, r.amount, r.status, r.coupon_code, r.admin_note, r.created_at, r.reviewed_at,
              u.name AS user_name, u.email AS user_email
       FROM cashback_redemptions r
       JOIN users u ON u.id = r.user_id
       ORDER BY
         CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
         r.created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({
      redemptions: rows.map((row) => ({
        id: Number(row.id),
        user_id: Number(row.user_id),
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
        user_name: String(row.user_name),
        user_email: String(row.user_email),
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
