import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { applySessionCookie, clientProfileComplete, signSession } from "@/lib/auth";
import { googleIdTokenSchema } from "@/lib/validators";
import { apiErrorMessage, getFirebaseAuthServerEnvErrors, getServerEnvErrors } from "@/lib/server-env";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { UserRole } from "@/lib/auth";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  cpf: string | null;
  phone: string | null;
};

type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  cpf: string | null;
  phone: string | null;
};

const jsonNoStore = {
  headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
} as const;

export async function POST(request: Request) {
  try {
    const envErrs = [...getServerEnvErrors(), ...getFirebaseAuthServerEnvErrors()];
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 503, ...jsonNoStore });
    }

    const body = await request.json();
    const parsed = googleIdTokenSchema.safeParse(body);
    if (!parsed.success) {
      const first =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Token inválido";
      return NextResponse.json({ error: first }, { status: 400, ...jsonNoStore });
    }

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);
    const emailRaw = decoded.email;
    if (!emailRaw || typeof emailRaw !== "string") {
      return NextResponse.json(
        { error: "Conta Google sem e-mail. Não é possível entrar." },
        { status: 401, ...jsonNoStore }
      );
    }
    if (decoded.email_verified === false) {
      return NextResponse.json(
        { error: "Confirme o e-mail na sua conta Google antes de continuar." },
        { status: 401, ...jsonNoStore }
      );
    }

    const email = emailRaw.toLowerCase().trim();
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, email, name, role, cpf, phone FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    let user: SessionUser | undefined = rows[0];
    if (!user) {
      const rawName =
        typeof decoded.name === "string" && decoded.name.trim()
          ? decoded.name.trim()
          : email.split("@")[0] || "Cliente";
      const displayName = rawName.slice(0, 255);
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
      const [ins] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (email, password_hash, name, cpf, phone, role)
         VALUES (?, ?, ?, NULL, NULL, 'CLIENT')`,
        [email, passwordHash, displayName]
      );
      let rawId = ins.insertId;
      let insertId = typeof rawId === "bigint" ? Number(rawId) : Number(rawId);
      if (!Number.isFinite(insertId) || insertId <= 0) {
        const [idRows] = await pool.query<RowDataPacket[]>(
          "SELECT LAST_INSERT_ID() AS id"
        );
        const lid = (idRows[0] as { id?: unknown } | undefined)?.id;
        insertId = typeof lid === "bigint" ? Number(lid) : Number(lid);
      }
      if (!Number.isFinite(insertId) || insertId <= 0) {
        throw new Error("Não foi possível criar o usuário (ID inválido).");
      }
      user = {
        id: insertId,
        email,
        name: displayName,
        role: "CLIENT",
        cpf: null,
        phone: null,
      };
    }

    const profileComplete = clientProfileComplete(user.role, user.cpf, user.phone);
    const token = await signSession({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      profileComplete,
    });
    const res = NextResponse.json(
      {
        ok: true,
        role: user.role,
        profileComplete,
      },
      jsonNoStore
    );
    return applySessionCookie(res, token);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: apiErrorMessage(e, "Erro ao entrar com Google. Tente novamente."),
      },
      { status: 500, ...jsonNoStore }
    );
  }
}
