"use client";

import { useState } from "react";

type Redemption = {
  id: number;
  amount: number;
  status: string;
  coupon_code: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function statusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Recusado";
  if (status === "USED") return "Usado";
  if (status === "CANCELLED") return "Cancelado";
  return status;
}

export function CashbackRedemptionsList({
  redemptions,
}: {
  redemptions: Redemption[];
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(null);
    }
  }

  if (redemptions.length === 0) {
    return (
      <p className="mt-2 text-sm text-[var(--muted)]">
        Nenhum pedido de resgate ou cupom gerado ainda.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2">
      {redemptions.map((item) => {
        const created = new Date(item.created_at).toLocaleString("pt-BR");
        return (
          <li
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  Resgate de R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{created}</p>
                {item.admin_note && (
                  <p className="mt-1 text-xs text-[var(--muted)]">Obs.: {item.admin_note}</p>
                )}
              </div>
              <span className="rounded-lg border border-[var(--border)] bg-slate-50 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                {statusLabel(item.status)}
              </span>
            </div>
            {item.coupon_code && (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-900">
                    Cupom gerado
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold text-emerald-950">
                    {item.coupon_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCoupon(item.coupon_code!)}
                  className="touch-target rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {copiedCode === item.coupon_code ? "Copiado!" : "Copiar cupom"}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
