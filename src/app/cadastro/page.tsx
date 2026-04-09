"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cpf,
          phone,
          email,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Falha no cadastro");
        return;
      }
      router.push("/painel");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Faixa amarela: altura ~42vh — separação um pouco acima do meio da tela */}
      <header className="relative flex min-h-[42vh] flex-col items-center justify-center bg-[var(--brand-yellow)] px-6 pb-10 pt-12 sm:min-h-[40vh] sm:pt-16">
        <h1 className="max-w-3xl text-center text-4xl font-extrabold tracking-tight text-[var(--brand-red)] sm:text-5xl md:text-6xl">
          Cadastro de cliente
        </h1>
        <p className="mt-5 max-w-lg text-center text-base font-medium text-[var(--brand-red)] sm:text-lg">
          Preencha seus dados abaixo. O cadastro público é apenas para clientes.
        </p>
      </header>

      <main className="flex flex-1 flex-col items-center bg-white px-4 pb-12 pt-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                inputMode="numeric"
                autoComplete="off"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
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
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Mínimo 6 caracteres"
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
              {loading ? "Cadastrando…" : "Criar conta"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-[var(--accent)] hover:underline">
              Entrar
            </Link>
          </p>
          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              ← Voltar ao início
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
