"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useGoogleAuthRedirect } from "@/lib/use-google-auth-redirect";
import { HomeGoogleAuthSection } from "@/components/home-google-auth-section";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { runGoogleLogin, googleLoading, googleError, setGoogleError } =
    useGoogleAuthRedirect();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGoogleError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Falha ao entrar");
        return;
      }
      if (data.role === "ADMIN") router.push("/admin");
      else if (data.profileComplete === false) router.push("/completar-cadastro");
      else router.push("/painel");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold sm:text-2xl">Entrar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Faça seu login</p>

      {motivo === "admin" && (
        <p className="mt-3 rounded-lg border border-[var(--brand-yellow)]/70 bg-[var(--brand-yellow)]/25 px-3 py-2 text-sm text-[var(--brand-red)]">
          Faça login como administrador para acessar essa área.
        </p>
      )}

      <HomeGoogleAuthSection
        className="mt-6"
        googleLoading={googleLoading}
        googleError={googleError}
        disabled={loading}
        onBeforeGoogle={() => setError(null)}
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

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none ring-[var(--accent)] focus:border-[var(--accent)] focus:ring-2"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="touch-target w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Não tem conta?{" "}
        <Link href="/cadastro?" className="font-medium text-[var(--accent)] hover:underline">
          Cadastre-se
        </Link>{" "}
        (cliente)
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Voltar ao início
        </Link>
      </p>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-[15px] md:text-base">
      <Suspense fallback={<div className="text-[var(--muted)]">Carregando…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
