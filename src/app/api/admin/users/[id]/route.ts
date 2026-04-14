import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  password: z.string().min(4).max(200),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }
    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const targetId = Number(idParam);
    if (!Number.isFinite(targetId) || targetId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Senha inválida (mín. 4 caracteres)." }, { status: 400 });
    }

    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [targetId]
    );
    const u = rows[0];
    if (!u || u.role !== "ADMIN") {
      return NextResponse.json({ error: "Usuário administrador não encontrado." }, { status: 404 });
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, targetId]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao atualizar senha.") },
      { status: 500 }
    );
  }
}
