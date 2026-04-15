import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { ensurePasswordResetTokensSchema } from "@/lib/password-reset-tokens";
import { getClientIp, rateLimitMemory } from "@/lib/rate-limit-memory";
import { strongPasswordSchema } from "@/lib/validators";
import { resetPasswordWithToken } from "@/services/password-reset-service";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    token: z.string().min(1, "Token ausente"),
    password: strongPasswordSchema,
    passwordConfirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  });

function messageForCode(code: "INVALID" | "EXPIRED" | "USED"): string {
  if (code === "EXPIRED") return "Este link expirou. Solicite uma nova redefinição de senha.";
  if (code === "USED") return "Este link já foi utilizado. Solicite uma nova redefinição se necessário.";
  return "Link inválido ou corrompido. Solicite um novo e-mail de recuperação.";
}

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const ip = getClientIp(request);
    const limited = rateLimitMemory(`auth:reset-password:${ip}`, 20, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Muitas tentativas. Aguarde ${limited.retryAfterSec} segundos.`,
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
      const flat = parsed.error.flatten();
      const first =
        flat.fieldErrors.token?.[0] ??
        flat.fieldErrors.password?.[0] ??
        flat.fieldErrors.passwordConfirm?.[0] ??
        flat.formErrors[0] ??
        "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const pool = getPool();
    await ensurePasswordResetTokensSchema(pool);

    const conn = await pool.getConnection();
    let result: Awaited<ReturnType<typeof resetPasswordWithToken>>;
    try {
      await conn.beginTransaction();
      result = await resetPasswordWithToken(conn, token, password);
      if (result.ok) {
        await conn.commit();
      } else {
        await conn.rollback();
      }
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    if (!result.ok) {
      const status = result.code === "INVALID" ? 400 : 410;
      return NextResponse.json({ error: messageForCode(result.code) }, { status });
    }

    return NextResponse.json({
      ok: true,
      message: "Senha alterada com sucesso. Você já pode entrar com a nova senha.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Não foi possível redefinir a senha.") },
      { status: 500 }
    );
  }
}
