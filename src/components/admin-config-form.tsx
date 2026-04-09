"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminConfigForm() {
  const router = useRouter();
  const [pct, setPct] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings");
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.cashbackPercentage === "number") {
        setPct(String(data.cashbackPercentage));
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseFloat(pct.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setError("Use um percentual entre 0 e 100.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashbackPercentage: n }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6 text-left shadow-sm sm:p-8 md:max-w-2xl md:p-10"
    >
      <p className="text-base font-medium text-[var(--accent)]">Cashback</p>
      <label htmlFor="pct" className="mt-4 block text-base font-medium">
        Porcentagem de cashback sobre o valor informado na NF (0–100%)
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          id="pct"
          type="text"
          inputMode="decimal"
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          className="w-36 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-2xl font-semibold text-[var(--foreground)]"
        />
        <span className="text-xl text-[var(--muted)]">%</span>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
        Ex.: 10% sobre R$ 100,00 de compra = R$ 10,00 creditados ao aprovar a NF.
      </p>
      {error && (
        <p className="mt-4 text-base text-[var(--error)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-xl bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
