import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { getPublicSiteOrigin } from "@/lib/site-url";

/**
 * URL absoluta de /login após logout (form HTML).
 * 1) NEXT_PUBLIC_POST_LOGOUT_LOGIN_URL — URL completa (recomendado atrás de proxy)
 * 2) Cabeçalhos X-Forwarded-* (comum na Hostinger)
 * 3) NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL
 * 4) request.url (dev local)
 */
function resolvePostLogoutLoginUrl(request: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_POST_LOGOUT_LOGIN_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).toString();
    } catch {
      /* ignorar valor inválido */
    }
  }

  const fwdHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (fwdHost) {
    const protoRaw = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : "https";
    return `${proto}://${fwdHost}/login`;
  }

  const origin = getPublicSiteOrigin();
  if (origin !== "http://localhost:3000") {
    return `${origin.replace(/\/$/, "")}/login`;
  }

  return new URL("/login", request.url).toString();
}

export async function POST(request: NextRequest) {
  await clearSessionCookie();
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(resolvePostLogoutLoginUrl(request));
}
