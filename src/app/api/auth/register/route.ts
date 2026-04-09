import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { applySessionCookie, signSession } from "@/lib/auth";
import { digitsOnly, isValidCpf, registerSchema } from "@/lib/validators";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

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
      return NextResponse.json({ error: "Corpo da requisição inválido (JSON)." }, { status: 400 });
    }
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      const first =
        Object.values(msg).flat()[0] ?? "Dados inválidos";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;
    const cpf = digitsOnly(parsed.data.cpf);

    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    const pool = getPool();

    const [existingEmail] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase().trim()]
    );
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 409 }
      );
    }

    const [existingCpf] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE cpf = ? LIMIT 1",
      [cpf]
    );
    if (existingCpf.length > 0) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, name, cpf, phone, role)
       VALUES (?, ?, ?, ?, ?, 'CLIENT')`,
      [email.toLowerCase().trim(), passwordHash, name.trim(), cpf, digitsOnly(phone)]
    );

    const rawId = result.insertId;
    const insertId =
      typeof rawId === "bigint" ? Number(rawId) : Number(rawId);
    if (!Number.isFinite(insertId) || insertId <= 0) {
      throw new Error("Não foi possível concluir o cadastro (ID inválido).");
    }
    const token = await signSession({
      sub: String(insertId),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: "CLIENT",
      profileComplete: true,
    });
    const res = NextResponse.json({ ok: true, role: "CLIENT" as const });
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: apiErrorMessage(
          e,
          "Erro ao cadastrar. Tente novamente."
        ),
      },
      { status: 500 }
    );
  }
}
