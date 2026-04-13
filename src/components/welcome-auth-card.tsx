"use client";

import Link from "next/link";
import { HomeGoogleAuthSection } from "@/components/home-google-auth-section";
import { useGoogleAuthRedirect } from "@/lib/use-google-auth-redirect";

export function WelcomeAuthCard() {
  const { runGoogleLogin, googleLoading, googleError, setGoogleError } =
    useGoogleAuthRedirect();

  return (
    <div className="mt-10 w-full max-w-lg sm:mt-12">
      <HomeGoogleAuthSection
        googleLoading={googleLoading}
        googleError={googleError}
        runGoogleLogin={runGoogleLogin}
        onBeforeGoogle={() => setGoogleError(null)}
      />
      <div className="relative my-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide text-[var(--muted)]">
          <span className="bg-white px-3">ou</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="touch-target flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-4 text-base font-semibold text-white shadow-md transition-[transform,background-color,box-shadow] duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.99]"
        >
          Entrar com e-mail
        </Link>
        <Link
          href="/register"
          className="touch-target flex w-full items-center justify-center rounded-2xl border-2 border-slate-900/10 bg-white px-5 py-4 text-base font-semibold text-slate-900 transition-[transform,background-color,border-color] duration-200 hover:border-slate-900/20 hover:bg-slate-50 active:scale-[0.99]"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
