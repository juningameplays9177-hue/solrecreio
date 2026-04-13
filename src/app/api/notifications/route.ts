import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
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
    const denied = denyUnlessClientWithCompleteProfile(session);
    if (denied) return denied;
    const client = asClientSessionReady(session);
    const userId = Number(client.sub);
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, body, read_at, created_at FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );
    const unreadCount = Number(countRows[0]?.c ?? 0);

    return NextResponse.json({ notifications: rows, unreadCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao carregar notificações.") },
      { status: 500 }
    );
  }
}
