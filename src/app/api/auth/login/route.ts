import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { applySessionCookie, clientProfileComplete, signSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import {
  apiErrorMessage,
  getServerEnvErrors,
  mysqlAuthRouteCatchStatus,
} from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";
import type { UserRole } from "@/lib/auth";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  cpf: string | null;
  phone: string | null;
};

function normalizeEmail(raw: string): string {
  return raw.normalize("NFKC").toLowerCase().trim().slice(0, 255);
}

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Formato inválido. Envie JSON com e-mail e senha." },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);
    const pool = getPool();

    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, email, name, password_hash, role, cpf, phone FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: "Não encontramos uma conta com este e-mail." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    const profileComplete = clientProfileComplete(user.role, user.cpf, user.phone);
    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      profileComplete,
    });
    const res = NextResponse.json({
      ok: true,
      role: user.role,
      profileComplete,
    });
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    const status = mysqlAuthRouteCatchStatus(e);
    return NextResponse.json(
      {
        error: apiErrorMessage(e, "Erro ao entrar. Tente novamente."),
      },
      { status }
    );
  }
}
