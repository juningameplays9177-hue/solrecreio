import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  applySessionCookie,
  clientProfileComplete,
  getSessionFromCookies,
  signSession,
} from "@/lib/auth";
import { completeProfileSchema, digitsOnly, isValidCpf } from "@/lib/validators";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";
import type { UserRole } from "@/lib/auth";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string;
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

    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    }
    if (session.role !== "CLIENT") {
      return NextResponse.json({ error: "Esta etapa é só para clientes." }, { status: 403 });
    }
    if (session.profileComplete) {
      return NextResponse.json({ error: "Seu cadastro já está completo." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido (JSON)." }, { status: 400 });
    }

    const parsed = completeProfileSchema.safeParse(body);
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const cpf = digitsOnly(parsed.data.cpf);
    const phone = digitsOnly(parsed.data.phone);

    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    const userId = Number(session.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const pool = getPool();

    const [dup] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE cpf = ? AND id <> ? LIMIT 1",
      [cpf, userId]
    );
    if (dup.length > 0) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado em outra conta." },
        { status: 409 }
      );
    }

    await pool.query(
      "UPDATE users SET cpf = ?, phone = ? WHERE id = ? AND role = 'CLIENT'",
      [cpf, phone, userId]
    );

    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, email, name, cpf, phone, role FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const profileComplete = clientProfileComplete(user.role, user.cpf, user.phone);
    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      profileComplete,
    });
    const res = NextResponse.json({ ok: true, profileComplete });
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao salvar. Tente novamente.") },
      { status: 500 }
    );
  }
}
