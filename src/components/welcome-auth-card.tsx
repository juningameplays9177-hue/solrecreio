"use client";

import Link from "next/link";
import { useGoogleAuthRedirect } from "@/lib/use-google-auth-redirect";
import { HomeGoogleAuthSection } from "@/components/home-google-auth-section";
import { InstallAppButton } from "@/components/install-app-button";

export function WelcomeAuthCard() {
  const { runGoogleLogin, googleLoading, googleError } = useGoogleAuthRedirect();

  return (
    <div className="mt-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:mt-12 sm:p-8">
      <HomeGoogleAuthSection
        googleLoading={googleLoading}
        googleError={googleError}
        runGoogleLogin={runGoogleLogin}
      />
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-[var(--card)] px-3 text-[var(--muted)]">ou</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
        <Link
          href="/entrar"
          className="touch-target inline-flex min-h-[52px] min-w-[10rem] items-center justify-center rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white transition hover:bg-[var(--accent-hover)] sm:min-w-[11rem] sm:text-lg"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro?"
          className="touch-target inline-flex min-h-[52px] min-w-[10rem] items-center justify-center rounded-xl border border-[var(--border)] bg-white px-8 py-4 text-base font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] sm:min-w-[11rem] sm:text-lg"
        >
          Cadastrar
        </Link>
      </div>
      <InstallAppButton />
    </div>
  );
}
