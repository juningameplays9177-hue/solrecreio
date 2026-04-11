"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PainelCashbackRedemptionForm({
  availableBalance,
}: {
  availableBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/cashback/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Falha ao solicitar resgate");
        return;
      }
      setAmount("");
      setMessage(
        typeof data.message === "string"
          ? data.message
          : "Pedido de resgate enviado para aprovacao."
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-slate-50 p-4"
    >
      <p className="text-sm font-medium text-[var(--accent)]">Resgatar cashback em cupom</p>
      <p className="text-xs text-[var(--muted)]">
        Solicite a partir de <strong className="text-[var(--foreground)]">R$ 10,00</strong>. O
        administrador aprova e o site gera seu cupom automaticamente.
      </p>
      <p className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
        Saldo disponivel agora:{" "}
        <strong className="text-[var(--foreground)]">
          R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </strong>
      </p>
      <div>
        <label htmlFor="valor-resgate" className="block text-sm font-medium">
          Valor do resgate (R$)
        </label>
        <input
          id="valor-resgate"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
          placeholder="10,00"
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--error)]" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-[var(--success)]" role="status">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="touch-target w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {loading ? "Enviando pedido..." : "Solicitar resgate"}
      </button>
    </form>
  );
}
