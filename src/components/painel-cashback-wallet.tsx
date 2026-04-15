"use client";

import { useCallback, useEffect, useState } from "react";
import { readAuthApiJson } from "@/lib/read-auth-api-response";

type LedgerEntry = {
  id: number;
  kind: "EARN" | "USE";
  amount: number;
  balanceAfter: number;
  source: string;
  createdAt: string;
};

type WalletPayload = {
  saldoCashback: number;
  limiteMaximo: number;
  espacoDisponivelParaGanhos: number;
  historicoCashback: LedgerEntry[];
  historicoUsoCashback: LedgerEntry[];
};

function formatBrl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatSource(s: string): string {
  const map: Record<string, string> = {
    purchase: "Compra (simulação)",
    invoice_approval: "Nota fiscal aprovada",
    wallet_use: "Uso direto",
    redemption_approval: "Resgate aprovado",
  };
  return map[s] ?? s;
}

export function PainelCashbackWallet() {
  const [data, setData] = useState<WalletPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseVal, setPurchaseVal] = useState("");
  const [useVal, setUseVal] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busyAdd, setBusyAdd] = useState(false);
  const [busyUse, setBusyUse] = useState(false);

  const reload = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/cashback", { credentials: "include" });
    const parsed = await readAuthApiJson<WalletPayload>(
      res,
      "Não foi possível carregar a carteira."
    );
    if (!parsed.ok) {
      setLoadError(parsed.message);
      setData(null);
      return;
    }
    setData(parsed.data as WalletPayload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const pct =
    data && data.limiteMaximo > 0
      ? Math.min(100, Math.max(0, (data.saldoCashback / data.limiteMaximo) * 100))
      : 0;

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    setActionErr(null);
    setBusyAdd(true);
    try {
      const purchaseAmount = Number(String(purchaseVal).replace(",", "."));
      const res = await fetch("/api/cashback/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ purchaseAmount }),
      });
      const parsed = await readAuthApiJson<{ message?: string }>(
        res,
        "Não foi possível creditar."
      );
      if (!parsed.ok) {
        setActionErr(parsed.message);
        return;
      }
      setActionMsg(
        typeof parsed.data.message === "string" ? parsed.data.message : "Crédito processado."
      );
      setPurchaseVal("");
      await reload();
    } finally {
      setBusyAdd(false);
    }
  };

  const onUse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    setActionErr(null);
    setBusyUse(true);
    try {
      const amount = Number(String(useVal).replace(",", "."));
      const res = await fetch("/api/cashback/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const parsed = await readAuthApiJson<{ message?: string }>(
        res,
        "Não foi possível usar o saldo."
      );
      if (!parsed.ok) {
        setActionErr(parsed.message);
        return;
      }
      setActionMsg(
        typeof parsed.data.message === "string" ? parsed.data.message : "Uso registrado."
      );
      setUseVal("");
      await reload();
    } finally {
      setBusyUse(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
        Carregando carteira de cashback…
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="rounded-2xl border border-[var(--error)]/30 bg-red-50/80 p-5 text-sm text-[var(--error)]">
        {loadError ?? "Carteira indisponível."}
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Carteira cashback
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--accent)] sm:text-3xl">
            {formatBrl(data.saldoCashback)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
            Limite máximo: {formatBrl(data.limiteMaximo)} · Espaço para novos ganhos:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {formatBrl(data.espacoDisponivelParaGanhos)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => reload()}
          className="mt-2 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--accent)] sm:mt-0"
        >
          Atualizar
        </button>
      </div>

      <div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--brand-red)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[11px] font-medium tabular-nums text-[var(--muted)]">
          {pct.toFixed(0)}% do limite
        </p>
      </div>

      {actionErr ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionErr}
        </p>
      ) : null}
      {actionMsg ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {actionMsg}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={onAdd} className="rounded-xl border border-[var(--border)]/80 bg-white/90 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Simular compra</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Calcula o cashback pela % configurada e credita até o teto de R$ 100.
          </p>
          <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
            Valor da compra (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={purchaseVal}
            onChange={(e) => setPurchaseVal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            placeholder="0,00"
          />
          <button
            type="submit"
            disabled={busyAdd}
            className="mt-3 w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {busyAdd ? "Processando…" : "Creditar cashback"}
          </button>
        </form>

        <form onSubmit={onUse} className="rounded-xl border border-[var(--border)]/80 bg-white/90 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Usar saldo</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Debita o valor informado e libera espaço para novos ganhos, até o limite.
          </p>
          <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
            Valor a usar (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={useVal}
            onChange={(e) => setUseVal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            placeholder="0,00"
          />
          <button
            type="submit"
            disabled={busyUse}
            className="mt-3 w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)] disabled:opacity-50"
          >
            {busyUse ? "Aplicando…" : "Usar cashback"}
          </button>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Histórico de ganhos</p>
          {data.historicoCashback.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Nenhum lançamento ainda.</p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {data.historicoCashback.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)]/60 bg-white/80 px-3 py-2"
                >
                  <span className="text-[var(--muted)]">
                    {formatSource(row.source)}
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {new Date(row.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-emerald-700">
                    +{formatBrl(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Histórico de uso</p>
          {data.historicoUsoCashback.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Nenhum uso registrado.</p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {data.historicoUsoCashback.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)]/60 bg-white/80 px-3 py-2"
                >
                  <span className="text-[var(--muted)]">
                    {formatSource(row.source)}
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {new Date(row.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--brand-red)]">
                    −{formatBrl(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
