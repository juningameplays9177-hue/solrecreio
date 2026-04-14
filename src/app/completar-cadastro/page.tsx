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

export default function CompletarCadastroPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível salvar.");
        return;
      }
      router.push("/mercado");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-[15px] md:text-base">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold sm:text-2xl">Complete seu cadastro</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Informe CPF e telefone para usar o painel e o programa de cashback.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none ring-[var(--accent)] focus:border-[var(--accent)] focus:ring-2"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Telefone (WhatsApp)
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
              className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none ring-[var(--accent)] focus:border-[var(--accent)] focus:ring-2"
              placeholder="(00) 00000-0000"
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
            {loading ? "Salvando…" : "Continuar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
