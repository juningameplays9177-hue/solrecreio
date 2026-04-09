import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { applySessionCookie, clientProfileComplete, signSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
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

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503 });
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const pool = getPool();

    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, email, name, password_hash, role, cpf, phone FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }

    const profileComplete = clientProfileComplete(user.role, user.cpf, user.phone);
    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      profileComplete,
    });
    const res = NextResponse.json({ ok: true, role: user.role, profileComplete });
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: apiErrorMessage(e, "Erro ao entrar. Tente novamente."),
      },
      { status: 500 }
    );
  }
}
