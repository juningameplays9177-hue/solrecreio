"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AuthAccessShell } from "@/components/auth/auth-access-shell";
import { readAuthApiJson } from "@/lib/read-auth-api-response";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[15px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-500 focus:border-[#fbc02d]/50 focus:bg-black/55 focus:ring-2 focus:ring-[#fbc02d]/25";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const parsed = await readAuthApiJson<{ message?: string }>(
          res,
          "Não foi possível enviar o pedido."
        );
        if (!parsed.ok) {
          setError(parsed.message);
          return;
        }
        const msg =
          typeof parsed.data.message === "string"
            ? parsed.data.message
            : "Verifique sua caixa de entrada.";
        setSuccess(msg);
        setEmail("");
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  return (
    <AuthAccessShell
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta. Se estiver cadastrado, enviaremos um link seguro (válido por 15 minutos)."
      footer={
        <p>
          <Link
            href="/login"
            className="font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
          >
            Voltar ao login
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="forgot-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="forgot-email"
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

        {error ? (
          <p
            className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            className="rounded-lg border border-emerald-500/30 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-100"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-red-900/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
        >
          <span className="relative z-10">
            {loading ? "Enviando…" : "Enviar link de redefinição"}
          </span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      </form>
    </AuthAccessShell>
  );
}
