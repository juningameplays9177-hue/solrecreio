import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export { SESSION_COOKIE_NAME };

export type UserRole = "ADMIN" | "CLIENT";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  profileComplete: boolean;
};

export function clientProfileComplete(
  role: UserRole,
  cpf: string | null | undefined,
  phone: string | null | undefined
): boolean {
  if (role === "ADMIN") return true;
  const c = typeof cpf === "string" ? cpf.trim() : "";
  const p = typeof phone === "string" ? phone.trim() : "";
  return c.length === 11 && p.length >= 10;
}

function readAuthSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const key = readAuthSecret();
  if (!key) {
    throw new Error("Defina AUTH_SECRET com pelo menos 16 caracteres no .env");
  }
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    profileComplete: payload.profileComplete,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const key = readAuthSecret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const sub = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const role = payload.role;
    const pc = payload.profileComplete;
    const profileComplete = typeof pc === "boolean" ? pc : true;
    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      (role !== "ADMIN" && role !== "CLIENT")
    ) {
      return null;
    }
    return { sub, email, name, role, profileComplete };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export type ClientSessionReady = SessionPayload & {
  role: "CLIENT";
  profileComplete: true;
};

export function denyUnlessClientWithCompleteProfile(
  session: SessionPayload | null
): NextResponse | null {
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!session.profileComplete) {
    return NextResponse.json(
      { error: "Complete seu cadastro (CPF e telefone) para continuar." },
      { status: 403 }
    );
  }
  return null;
}

export function asClientSessionReady(session: SessionPayload | null): ClientSessionReady {
  if (!session || session.role !== "CLIENT" || !session.profileComplete) {
    throw new Error("Sessão de cliente inválida (perfil incompleto).");
  }
  return session as ClientSessionReady;
}

export function applySessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return res;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
