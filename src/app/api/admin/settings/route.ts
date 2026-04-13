import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import {
  ensureAppSettingsSchema,
  getCashbackPercentage,
} from "@/lib/app-settings";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  cashbackPercentage: z.number().min(0).max(100),
});

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
    const cashbackPercentage = await getCashbackPercentage(pool);
    return NextResponse.json({ cashbackPercentage });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao carregar configurações.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503 });
    }
    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Percentual inválido (0 a 100)." }, { status: 400 });
    }

    const pool = getPool();
    await ensureAppSettingsSchema(pool);
    const v = String(parsed.data.cashbackPercentage);
    await pool.query(
      `INSERT INTO app_settings (\`key\`, value) VALUES ('cashback_percentage', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [v]
    );

    return NextResponse.json({
      ok: true,
      cashbackPercentage: parsed.data.cashbackPercentage,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao salvar.") },
      { status: 500 }
    );
  }
}
