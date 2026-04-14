"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AuthAccessShell } from "@/components/auth/auth-access-shell";
import { HomeGoogleAuthSection } from "@/components/home-google-auth-section";
import { useGoogleAuthRedirect } from "@/lib/use-google-auth-redirect";
import { registrationFormSchema, strongPasswordSchema } from "@/lib/validators";

const inputClass =
  "w-full rounded-2xl border border-amber-200/75 bg-white/95 px-4 py-3.5 text-[15px] text-slate-900 outline-none shadow-sm transition-[border-color,box-shadow,background-color,transform] duration-200 placeholder:text-slate-400 focus:-translate-y-[1px] focus:border-[#fbc02d] focus:bg-white focus:ring-4 focus:ring-[#fbc02d]/20";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#9a7209]";

const googleBtnLight =
  "border-amber-200/80 bg-white text-slate-800 shadow-sm hover:border-amber-300 hover:bg-gradient-to-br hover:from-amber-50/90 hover:to-white hover:shadow-md";

const highlightCards = [
  {
    title: "Cadastro em 1 minuto",
    subtitle: "Entre rápido e acompanhe seus benefícios.",
  },
  {
    title: "Visual da marca",
    subtitle: "Cores quentes alinhadas ao tema Sol do Recreio.",
  },
  {
    title: "Fluxo seguro",
    subtitle: "Seus dados ficam protegidos durante todo o processo.",
  },
];

function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneBr(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function passwordHints(password: string): { ok: boolean; label: string }[] {
  return [
    { ok: password.length >= 8, label: "Pelo menos 8 caracteres" },
    { ok: /[a-z]/.test(password), label: "Uma letra minúscula" },
    { ok: /[A-Z]/.test(password), label: "Uma letra maiúscula" },
    { ok: /[0-9]/.test(password), label: "Um número" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Um símbolo especial" },
  ];
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const prefilledName = searchParams.get("name") ?? "";
  const { runGoogleLogin, googleLoading, googleError, setGoogleError } =
    useGoogleAuthRedirect();
  const [name, setName] = useState(prefilledName);
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hints = useMemo(() => passwordHints(password), [password]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      const pre = registrationFormSchema.safeParse({
        name,
        email,
        password,
        passwordConfirm,
        cpf,
        phone,
      });
      if (!pre.success) {
        const flat = pre.error.flatten();
        const first =
          Object.values(flat.fieldErrors)
            .flat()
            .find((m): m is string => typeof m === "string") ??
          flat.formErrors[0] ??
          "Verifique os dados.";
        setError(first);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            passwordConfirm,
            cpf,
            phone,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          profileComplete?: boolean;
        };
        if (!res.ok) {
          setError(
            typeof data.error === "string" ? data.error : "Não foi possível cadastrar."
          );
          return;
        }
        setSuccess("Conta criada. Redirecionando…");
        if (data.profileComplete === false) {
          router.push("/completar-cadastro");
        } else {
          router.push("/loja");
        }
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [cpf, email, name, password, passwordConfirm, phone, router]
  );

  const pwdPreview = strongPasswordSchema.safeParse(password);

  return (
    <AuthAccessShell
      variant="light"
      title="Crie sua conta"
      subtitle="Use o Google ou cadastre-se com e-mail e senha. CPF e telefone são opcionais aqui; se preencher os dois corretamente, o cadastro já fica completo."
      footer={
        <p>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#c62828] underline decoration-[#fbc02d]/70 decoration-2 underline-offset-2 transition-colors hover:text-[#fbc02d] hover:decoration-[#fbc02d]"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
        {highlightCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/80 to-red-50/70 p-3 shadow-sm"
          >
            <p className="text-xs font-semibold text-[#8a6508]">{card.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <HomeGoogleAuthSection
        googleLoading={googleLoading}
        googleError={googleError}
        runGoogleLogin={runGoogleLogin}
        disabled={loading}
        buttonClassName={googleBtnLight}
        errorClassName="text-red-600"
        onBeforeGoogle={() => {
          setError(null);
          setSuccess(null);
          setGoogleError(null);
        }}
      />

      <div className="relative my-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7209]">
          <span className="rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50/95 via-white to-red-50/80 px-4 py-1 shadow-sm">
            ou com e-mail
          </span>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-amber-100/80 bg-white/75 p-4 shadow-[0_16px_40px_-24px_rgba(211,47,47,0.25)] sm:p-5"
      >
        <div>
          <label htmlFor="reg-name" className={labelClass}>
            Nome completo
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Como aparecerá no painel"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className={labelClass}>
            Senha
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Senha forte"
          />
          <ul className="mt-2 space-y-1 text-xs text-slate-500" aria-live="polite">
            {hints.map((h) => (
              <li
                key={h.label}
                className={
                  h.ok ? "font-medium text-emerald-700" : "text-slate-500"
                }
              >
                <span className="mr-1 inline-block w-3" aria-hidden>
                  {h.ok ? "✓" : "○"}
                </span>
                {h.label}
              </li>
            ))}
          </ul>
          {password.length > 0 && !pwdPreview.success ? (
            <p className="mt-1 text-xs font-medium text-amber-800/90">
              Ajuste a senha para atender a todos os requisitos.
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="reg-password2" className={labelClass}>
            Confirmar senha
          </label>
          <input
            id="reg-password2"
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

        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/95 via-white to-red-50/45 p-4 shadow-inner ring-1 ring-red-100/40">
          <p className="mb-3 bg-gradient-to-r from-[#9a7209] to-[#c62828] bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent">
            Opcional
          </p>
          <p className="mb-4 text-xs leading-relaxed text-slate-600">
            Se informar CPF e telefone válidos agora, você já acessa o painel sem a
            etapa “completar cadastro”.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-cpf" className={labelClass}>
                CPF
              </label>
              <input
                id="reg-cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className={inputClass}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className={labelClass}>
                Telefone (WhatsApp)
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
                className={inputClass}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#fbc02d] via-[#f9a825] to-[#d32f2f] py-3.5 text-sm font-semibold text-[#1a1003] shadow-lg shadow-amber-900/20 transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:shadow-red-900/15 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
        >
          <span className="relative z-10">
            {loading ? "Criando conta…" : "Criar conta"}
          </span>
          <span
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      </form>
    </AuthAccessShell>
  );
}
