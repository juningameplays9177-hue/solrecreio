import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

/**
 * HTML em cache (CDN/browser) com referências a chunks antigos de /_next/static → 404.
 * O `?` na URL muda a chave de cache e “funciona”; estes headers evitam HTML velho.
 */
function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {
    return noStore(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const key = new TextEncoder().encode(secret);

  let role: string | undefined;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      role = typeof payload.role === "string" ? payload.role : undefined;
    } catch {
      role = undefined;
    }
  }

  if (pathname === "/completar-cadastro") {
    if (!token || !role) {
      return noStore(NextResponse.redirect(new URL("/login", request.url)));
    }
    if (role === "ADMIN") {
      return noStore(NextResponse.redirect(new URL("/admin", request.url)));
    }
    if (role === "CLIENT") {
      return noStore(NextResponse.redirect(new URL("/painel", request.url)));
    }
    return noStore(NextResponse.next());
  }

  if (pathname.startsWith("/admin")) {
    if (role === "CLIENT") {
      return noStore(NextResponse.redirect(new URL("/painel", request.url)));
    }
    if (role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("motivo", "admin");
      return noStore(NextResponse.redirect(url));
    }
  }

  if (pathname.startsWith("/painel")) {
    if (role !== "CLIENT" && role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return noStore(NextResponse.redirect(url));
    }
    /** Perfil incompleto: o próprio /painel mostra o formulário de CPF/telefone (ex.: após Google). */
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
