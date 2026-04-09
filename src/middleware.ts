import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import { jwtVerify } from "jose";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";



export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {

    return NextResponse.next();

  }



  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const key = new TextEncoder().encode(secret);



  let role: string | undefined;

  let profileComplete = true;

  if (token) {

    try {

      const { payload } = await jwtVerify(token, key);

      role = typeof payload.role === "string" ? payload.role : undefined;

      if (typeof payload.profileComplete === "boolean") {

        profileComplete = payload.profileComplete;

      }

    } catch {

      role = undefined;

      profileComplete = true;

    }

  }



  if (pathname === "/completar-cadastro") {

    if (!token || !role) {

      return NextResponse.redirect(new URL("/entrar", request.url));

    }

    if (role === "ADMIN") {

      return NextResponse.redirect(new URL("/admin", request.url));

    }

    if (role === "CLIENT" && profileComplete) {

      return NextResponse.redirect(new URL("/painel", request.url));

    }

    return NextResponse.next();

  }



  if (pathname.startsWith("/admin")) {

    if (role === "CLIENT") {

      return NextResponse.redirect(new URL("/painel", request.url));

    }

    if (role !== "ADMIN") {

      const url = request.nextUrl.clone();

      url.pathname = "/entrar";

      url.searchParams.set("motivo", "admin");

      return NextResponse.redirect(url);

    }

  }



  if (pathname.startsWith("/painel")) {

    if (role !== "CLIENT" && role !== "ADMIN") {

      const url = request.nextUrl.clone();

      url.pathname = "/entrar";

      return NextResponse.redirect(url);

    }

    if (role === "CLIENT" && !profileComplete) {

      return NextResponse.redirect(new URL("/completar-cadastro", request.url));

    }

  }



  return NextResponse.next();

}



export const config = {

  matcher: ["/admin/:path*", "/painel/:path*", "/completar-cadastro"],

};

