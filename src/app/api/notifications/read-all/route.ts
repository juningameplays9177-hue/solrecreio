import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST() {
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
    await pool.query(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL",
      [userId]
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
