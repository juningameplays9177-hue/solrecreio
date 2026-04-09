import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(4).max(200),
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
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, created_at FROM users WHERE role = 'ADMIN' ORDER BY name ASC`
    );

    return NextResponse.json({ users: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao listar usuários.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha válidos são obrigatórios (senha mín. 4 caracteres)." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const emailNorm = email.toLowerCase().trim();
    const pool = getPool();

    const [exists] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [emailNorm]
    );
    if (exists.length > 0) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, cpf, phone, role, cashback_balance)
       VALUES (?, ?, ?, NULL, NULL, 'ADMIN', 0)`,
      [emailNorm, hash, name.trim()]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao criar usuário.") },
      { status: 500 }
    );
  }
}
