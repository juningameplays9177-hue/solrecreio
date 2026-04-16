"use client";

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

export function PainelProfileCompletionCard() {
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
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="completar-cadastro-painel"
      className="mb-8 scroll-mt-24 rounded-2xl border-2 border-[var(--accent)]/40 bg-amber-50/90 p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">Terminar cadastro no painel</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        <span className="font-semibold text-slate-900">Opcional</span>
        {" — "}
        Se informar CPF e telefone válidos agora, você já usa este painel por completo — envio de
        nota fiscal, carteira de cashback e <strong>resgate em cupom</strong> — sem a etapa separada
        &quot;completar cadastro&quot;.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        Preencha os campos abaixo (mesmos dados usados em &quot;completar cadastro&quot;).
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="painel-cpf" className="block text-sm font-medium text-slate-800">
            CPF
          </label>
          <input
            id="painel-cpf"
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            required
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[var(--accent)] focus:border-[var(--accent)] focus:ring-2"
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label htmlFor="painel-phone" className="block text-sm font-medium text-slate-800">
            Telefone (WhatsApp)
          </label>
          <input
            id="painel-phone"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
            className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base text-slate-900 outline-none ring-[var(--accent)] focus:border-[var(--accent)] focus:ring-2"
            placeholder="(00) 00000-0000"
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="touch-target w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Salvar e continuar"}
        </button>
      </form>
    </div>
  );
}
