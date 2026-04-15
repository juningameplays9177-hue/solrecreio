"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthAccessShell } from "@/components/auth/auth-access-shell";
import { readAuthApiJson } from "@/lib/read-auth-api-response";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[15px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-500 focus:border-[#fbc02d]/50 focus:bg-black/55 focus:ring-2 focus:ring-[#fbc02d]/25";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400";

function tokenErrorMessage(code: string | undefined): string {
  if (code === "EXPIRED") return "Este link expirou. Solicite um novo e-mail em “Esqueci minha senha”.";
  if (code === "USED") return "Este link já foi usado. Faça login ou solicite outro e-mail.";
  return "Link inválido. Abra o endereço completo enviado por e-mail ou peça um novo.";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenCheck, setTokenCheck] = useState<"idle" | "ok" | "bad">("idle");
  const [tokenCode, setTokenCode] = useState<string | undefined>();

  useEffect(() => {
    if (!tokenParam) {
      setTokenCheck("bad");
      setTokenCode(undefined);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/validate-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        valid?: boolean;
        code?: string;
      };
      if (cancelled) return;
      if (data.valid === true) {
        setTokenCheck("ok");
      } else {
        setTokenCheck("bad");
        setTokenCode(typeof data.code === "string" ? data.code : undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenParam]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      if (!tokenParam) {
        setError("Token ausente na URL.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenParam,
            password,
            passwordConfirm,
          }),
        });
        const parsed = await readAuthApiJson<{ message?: string }>(
          res,
          "Não foi possível redefinir a senha."
        );
        if (!parsed.ok) {
          setError(parsed.message);
          return;
        }
        const msg =
          typeof parsed.data.message === "string"
            ? parsed.data.message
            : "Senha alterada.";
        setSuccess(msg);
        setPassword("");
        setPasswordConfirm("");
        setTimeout(() => router.push("/login"), 2200);
      } finally {
        setLoading(false);
      }
    },
    [tokenParam, password, passwordConfirm, router]
  );

  if (!tokenParam) {
    return (
      <AuthAccessShell
        title="Redefinir senha"
        subtitle="Abra o link enviado por e-mail ou solicite uma nova recuperação de senha."
        footer={
          <p>
            <Link
              href="/forgot-password"
              className="font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
            >
              Esqueci minha senha
            </Link>
            {" · "}
            <Link
              href="/login"
              className="font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
            >
              Login
            </Link>
          </p>
        }
      >
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/95">
          Nenhum token encontrado. Use o botão no e-mail ou peça um novo link.
        </p>
      </AuthAccessShell>
    );
  }

  if (tokenCheck === "idle") {
    return (
      <AuthAccessShell
        title="Redefinir senha"
        subtitle="Validando o link seguro…"
        footer={null}
      >
        <p className="text-center text-sm text-slate-400">Verificando…</p>
      </AuthAccessShell>
    );
  }

  if (tokenCheck === "bad") {
    return (
      <AuthAccessShell
        title="Link indisponível"
        subtitle="Não foi possível usar este endereço para redefinir a senha."
        footer={
          <p>
            <Link
              href="/forgot-password"
              className="font-medium text-[#fbc02d] transition-colors hover:text-amber-200"
            >
              Solicitar novo e-mail
            </Link>
          </p>
        }
      >
        <p
          className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100"
          role="alert"
        >
          {tokenErrorMessage(tokenCode)}
        </p>
      </AuthAccessShell>
    );
  }

  return (
    <AuthAccessShell
      title="Nova senha"
      subtitle="Escolha uma senha forte. Em seguida você poderá entrar normalmente."
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
          <label htmlFor="reset-password" className={labelClass}>
            Nova senha
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Mín. 8 caracteres, maiúscula, número e símbolo"
          />
        </div>
        <div>
          <label htmlFor="reset-password-confirm" className={labelClass}>
            Confirmar senha
          </label>
          <input
            id="reset-password-confirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={inputClass}
            placeholder="Repita a senha"
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
            {loading ? "Salvando…" : "Salvar nova senha"}
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
