import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { applySessionCookie, clientProfileComplete, signSession } from "@/lib/auth";
import { emailRegisterSchema } from "@/lib/validators";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

function sanitizeDisplayName(name: string): string {
  return name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, 200);
}

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido (JSON)." },
        { status: 400 }
      );
    }

    const parsed = emailRegisterSchema.safeParse(body);
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const name = sanitizeDisplayName(parsed.data.name);

    const pool = getPool();

    const [existingEmail] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, name, cpf, phone, role)
       VALUES (?, ?, ?, NULL, NULL, 'CLIENT')`,
      [email, passwordHash, name]
    );

    const rawId = result.insertId;
    const insertId =
      typeof rawId === "bigint" ? Number(rawId) : Number(rawId);
    if (!Number.isFinite(insertId) || insertId <= 0) {
      throw new Error("Não foi possível concluir o cadastro (ID inválido).");
    }

    const profileComplete = clientProfileComplete("CLIENT", null, null);
    const token = await signSession({
      sub: String(insertId),
      email,
      name,
      role: "CLIENT",
      profileComplete,
    });

    const res = NextResponse.json({
      ok: true,
      role: "CLIENT" as const,
      profileComplete,
    });
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: apiErrorMessage(e, "Erro ao cadastrar. Tente novamente."),
      },
      { status: 500 }
    );
  }
}
