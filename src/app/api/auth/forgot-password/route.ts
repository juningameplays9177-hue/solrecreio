import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { ensurePasswordResetTokensSchema } from "@/lib/password-reset-tokens";
import { getClientIp, rateLimitMemory } from "@/lib/rate-limit-memory";
import {
  createPasswordResetFlow,
  sendPasswordResetEmail,
} from "@/services/password-reset-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z
    .string()
    .email("E-mail inválido")
    .max(255)
    .transform((s) => s.toLowerCase().trim()),
});

const PUBLIC_MESSAGE =
  "Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.";

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const ip = getClientIp(request);
    const limited = rateLimitMemory(`auth:forgot-password:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Muitas tentativas. Aguarde ${limited.retryAfterSec} segundos e tente novamente.`,
        },
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
      const msg = parsed.error.flatten().fieldErrors.email?.[0] ?? "Dados inválidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email;
    const pool = getPool();
    await ensurePasswordResetTokensSchema(pool);

    const conn = await pool.getConnection();
    let flow: Awaited<ReturnType<typeof createPasswordResetFlow>> = null;
    try {
      await conn.beginTransaction();
      flow = await createPasswordResetFlow(conn, email);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    if (flow) {
      try {
        await sendPasswordResetEmail(email, flow.rawToken);
      } catch (e) {
        console.error("sendPasswordResetEmail:", e);
      }
    }

    return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Não foi possível enviar o e-mail.") },
      { status: 500 }
    );
  }
}
