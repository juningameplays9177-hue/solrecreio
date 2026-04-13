"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PainelCashbackForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("amount", amount.replace(",", "."));
      if (file) fd.set("file", file);
      const res = await fetch("/api/cashback/invoices", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Falha ao enviar");
        return;
      }
      setAmount("");
      setFile(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-slate-50 p-4">
      <p className="text-sm font-medium text-[var(--accent)]">Enviar nota fiscal (cashback)</p>
      <p className="text-xs text-[var(--muted)]">
        Informe o valor e, se quiser, envie uma foto da NF. Fica{" "}
        <strong className="text-[var(--foreground)]">pendente</strong> até o administrador aprovar.
      </p>
      <div>
        <label htmlFor="valor-nf" className="block text-sm font-medium">
          Valor (R$)
        </label>
        <input
          id="valor-nf"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
          placeholder="0,00"
        />
      </div>
      <div>
        <p className="block text-sm font-medium">Foto da NF (opcional)</p>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            id="arquivo-nf"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="arquivo-nf"
            className="touch-target inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--input-bg)] sm:w-auto"
          >
            Tirar foto
          </label>
          <span className="min-w-0 truncate text-sm text-[var(--muted)]">
            {file ? file.name : "Nenhuma foto anexada"}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          No celular, abre a câmera para fotografar a nota. No PC, você pode escolher uma imagem
          salva. JPG, PNG ou WEBP — máx. 5 MB.
        </p>
      </div>
      {error && (
        <p className="text-sm text-[var(--error)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="touch-target w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar para análise"}
      </button>
    </form>
  );
}
