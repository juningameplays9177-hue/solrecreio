import { NextResponse } from "next/server";

/** GET /api/health — sem DB; útil para ver se o Node/Next responde na Hostinger. */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "sol-do-recreio", ts: new Date().toISOString() },
    { status: 200 }
  );
}
