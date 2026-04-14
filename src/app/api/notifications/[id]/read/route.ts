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

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id: idParam } = await context.params;
    const nid = Number(idParam);
    if (!Number.isFinite(nid) || nid <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pool = getPool();
    const [r] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM notifications WHERE id = ? AND user_id = ? LIMIT 1",
      [nid, userId]
    );
    if (!r[0]) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    await pool.query(
      "UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL",
      [nid, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro.") },
      { status: 500 }
    );
  }
}
