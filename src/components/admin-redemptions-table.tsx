"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Redemption = {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  coupon_code: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_name: string;
  user_email: string;
};

function statusLabel(status: string) {
  if (status === "PENDING") return { text: "Pendente", className: "text-[var(--brand-red)] bg-[var(--brand-yellow)]/35 border-[var(--brand-yellow)]" };
  if (status === "APPROVED") return { text: "Aprovado", className: "text-emerald-900 bg-emerald-100 border-emerald-300" };
  if (status === "REJECTED") return { text: "Recusado", className: "text-[var(--brand-red)] bg-[var(--brand-red)]/12 border-[var(--brand-red)]" };
  return { text: status, className: "text-[var(--foreground)] bg-slate-100 border-[var(--border)]" };
}

export function AdminRedemptionsTable({
  redemptions,
}: {
  redemptions: Redemption[];
}) {
  const router = useRouter();
  const [noteById, setNoteById] = useState<Record<number, string>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function act(id: number, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/cashback/redemptions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: noteById[id]?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (redemptions.length === 0) {
    return <p className="py-4 text-center text-base text-[var(--muted)]">Nenhum pedido de resgate ainda.</p>;
  }

  return (
    <div className="scroll-touch overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[960px] text-left text-base">
        <thead>
          <tr className="border-b border-[var(--border)] bg-slate-100">
            <th className="p-4 font-semibold">Cliente</th>
            <th className="p-4 font-semibold">Valor</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold">Cupom</th>
            <th className="p-4 font-semibold">Data</th>
            <th className="p-4 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {redemptions.map((item) => {
            const st = statusLabel(item.status);
            const dt = new Date(item.created_at).toLocaleString("pt-BR");
            return (
              <tr key={item.id} className="border-b border-[var(--border)]/60">
                <td className="p-4 align-top">
                  <div className="font-medium">{item.user_name}</div>
                  <div className="mt-0.5 text-sm text-[var(--muted)]">{item.user_email}</div>
                </td>
                <td className="p-4 align-top whitespace-nowrap">
                  R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 align-top">
                  <span className={`inline-block rounded-lg border px-2.5 py-1 text-sm ${st.className}`}>
                    {st.text}
                  </span>
                </td>
                <td className="p-4 align-top text-sm">
                  {item.coupon_code ? (
                    <span className="font-mono font-semibold text-emerald-700">{item.coupon_code}</span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="p-4 align-top text-sm text-[var(--muted)]">{dt}</td>
                <td className="p-4 align-top">
                  {item.status === "PENDING" ? (
                    <div className="flex max-w-[18rem] flex-col gap-2.5">
                      <textarea
                        placeholder="Observação (opcional)"
                        value={noteById[item.id] ?? ""}
                        onChange={(e) =>
                          setNoteById((current) => ({ ...current, [item.id]: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => act(item.id, "approve")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => act(item.id, "reject")}
                          className="rounded-xl border border-[var(--brand-red)] bg-[var(--brand-yellow)]/30 px-4 py-2 text-sm font-semibold text-[var(--brand-red)] hover:bg-[var(--brand-yellow)]/50 disabled:opacity-50"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
