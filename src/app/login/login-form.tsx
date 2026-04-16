"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AuthAccessShell } from "@/components/auth/auth-access-shell";
import { readAuthApiJson } from "@/lib/read-auth-api-response";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[15px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-500 focus:border-[#fbc02d]/50 focus:bg-black/55 focus:ring-2 focus:ring-[#fbc02d]/25";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const parsed = await readAuthApiJson<{
          error?: string;
          profileComplete?: boolean;
          role?: string;
        }>(res, "Não foi possível entrar.");
        if (!parsed.ok) {
          setError(parsed.message);
          return;
        }
        const data = parsed.data;
        if (data.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/painel");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <AuthAccessShell
      title="Entre na sua conta"
      subtitle="Entre com e-mail e senha. Administradores e clientes usam o mesmo acesso."
      footer={
        <p>
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
          >
            Criar conta
          </Link>
        </p>
      }
    >
      {motivo === "admin" ? (
        <p
          className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/95"
          role="status"
        >
          Esta área é restrita a administradores. Entre com uma conta de admin.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="voce@exemplo.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        {error ? (
          <p
            className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-red-900/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
        >
          <span className="relative z-10">{loading ? "Entrando…" : "Entrar"}</span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      </form>
    </AuthAccessShell>
  );
}
