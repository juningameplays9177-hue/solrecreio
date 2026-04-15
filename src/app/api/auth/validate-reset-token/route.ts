import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { ensurePasswordResetTokensSchema } from "@/lib/password-reset-tokens";
import { getClientIp, rateLimitMemory } from "@/lib/rate-limit-memory";
import { validateResetTokenRow } from "@/services/password-reset-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const ip = getClientIp(request);
    const limited = rateLimitMemory(`auth:validate-reset:${ip}`, 40, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um momento." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Token ausente" }, { status: 400 });
    }

    const pool = getPool();
    await ensurePasswordResetTokensSchema(pool);

    const conn = await pool.getConnection();
    let v: Awaited<ReturnType<typeof validateResetTokenRow>>;
    try {
      v = await validateResetTokenRow(conn, parsed.data.token);
    } finally {
      conn.release();
    }

    if (!v.valid) {
      return NextResponse.json(
        {
          valid: false,
          code: v.code,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Não foi possível validar o link.") },
      { status: 500 }
    );
  }
}
