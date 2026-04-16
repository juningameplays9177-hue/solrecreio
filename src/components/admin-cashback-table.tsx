"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Invoice = {
  id: number;
  user_id: number;
  amount: string;
  credited_amount: string | null;
  status: string;
  original_filename: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
};

function statusLabel(s: string) {
  const y = "text-[var(--brand-red)] bg-[var(--brand-yellow)]/35 border-[var(--brand-yellow)]";
  const r = "text-[var(--brand-red)] bg-[var(--brand-red)]/12 border-[var(--brand-red)]";
  const approved = "text-emerald-900 bg-emerald-100 border-emerald-300";
  if (s === "PENDING")
    return {
      text: "Pendente",
      className: y,
    };
  if (s === "APPROVED")
    return {
      text: "Aprovado",
      className: approved,
    };
  if (s === "REJECTED")
    return {
      text: "Recusado",
      className: r,
    };
  return { text: s, className: "" };
}

export function AdminCashbackTable({
  invoices,
  cashbackPercentage,
}: {
  invoices: Invoice[];
  cashbackPercentage: number;
}) {
  const router = useRouter();
  const [noteById, setNoteById] = useState<Record<number, string>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    id: number;
    action: "approve" | "reject";
    clientLabel: string;
  } | null>(null);

  async function act(id: number, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/cashback/invoices/${id}`, {
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

  if (invoices.length === 0) {
    return (
      <p className="py-4 text-center text-base text-[var(--muted)]">
        Nenhuma solicitação de cashback ainda.
      </p>
    );
  }

  return (
    <>
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashback-confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="Fechar"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl sm:p-7">
            <p
              id="cashback-confirm-title"
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Aviso
            </p>
            <div
              className={`mt-3 rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${
                confirmDialog.action === "approve"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : "border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/25 text-[var(--brand-red)]"
              }`}
            >
              {confirmDialog.action === "approve" ? (
                <>
                  Ao <strong>aprovar</strong>, o cashback será creditado na conta de{" "}
                  <strong>{confirmDialog.clientLabel}</strong> conforme a porcentagem
                  vigente. Confirma a aprovação?
                </>
              ) : (
                <>
                  Ao <strong>recusar</strong>, a solicitação de{" "}
                  <strong>{confirmDialog.clientLabel}</strong> será encerrada e não poderá
                  ser aprovada depois. Confirma a recusa?
                </>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                className="touch-target rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-slate-50"
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loadingId === confirmDialog.id}
                className={`touch-target rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  confirmDialog.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[var(--brand-red)] hover:opacity-90"
                }`}
                onClick={async () => {
                  const { id, action } = confirmDialog;
                  setConfirmDialog(null);
                  await act(id, action);
                }}
              >
                {confirmDialog.action === "approve" ? "Confirmar aprovação" : "Confirmar recusa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="scroll-touch overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[920px] text-left text-base">
        <thead>
          <tr className="border-b border-[var(--border)] bg-slate-100">
            <th className="p-4 font-semibold">Cliente</th>
            <th className="p-4 font-semibold">Valor informado</th>
            <th className="p-4 font-semibold">Cashback</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold">Data</th>
            <th className="p-4 font-semibold">NF</th>
            <th className="p-4 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const st = statusLabel(inv.status);
            const dt = new Date(inv.created_at).toLocaleString("pt-BR");
            return (
              <tr key={inv.id} className="border-b border-[var(--border)]/60">
                <td className="p-4 align-top">
                  <Link
                    href={`/admin/clientes/${inv.user_id}`}
                    className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] hover:underline"
                  >
                    {inv.user_name}
                  </Link>
                  <div className="mt-0.5 text-sm">
                    <Link
                      href={`/admin/clientes/${inv.user_id}`}
                      className="text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
                    >
                      {inv.user_email}
                    </Link>
                  </div>
                </td>
                <td className="p-4 align-top whitespace-nowrap">
                  R$ {Number(inv.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 align-top text-sm">
                  {inv.status === "APPROVED" && inv.credited_amount != null ? (
                    <span className="font-medium text-emerald-700">
                      R${" "}
                      {Number(inv.credited_amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ) : inv.status === "PENDING" ? (
                    <span className="text-[var(--muted)]">
                      ~ R${" "}
                      {(
                        (Number(inv.amount) * cashbackPercentage) /
                        100
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                      <span className="block text-xs">({cashbackPercentage}%)</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-4 align-top">
                  <span className={`inline-block rounded-lg border px-2.5 py-1 text-sm ${st.className}`}>
                    {st.text}
                  </span>
                </td>
                <td className="p-4 align-top text-sm text-[var(--muted)]">{dt}</td>
                <td className="p-4 align-top">
                  {inv.original_filename ? (
                    <a
                      href={`/api/admin/cashback/invoices/${inv.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-medium text-[var(--accent)] hover:underline"
                    >
                      Ver arquivo
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="p-4 align-top">
                  {inv.status === "PENDING" ? (
                    <div className="flex max-w-[18rem] flex-col gap-2.5">
                      <textarea
                        placeholder="Observação (opcional)"
                        value={noteById[inv.id] ?? ""}
                        onChange={(e) =>
                          setNoteById((m) => ({ ...m, [inv.id]: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loadingId === inv.id}
                          onClick={() =>
                            setConfirmDialog({
                              id: inv.id,
                              action: "approve",
                              clientLabel: inv.user_name,
                            })
                          }
                          className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === inv.id}
                          onClick={() =>
                            setConfirmDialog({
                              id: inv.id,
                              action: "reject",
                              clientLabel: inv.user_name,
                            })
                          }
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
    </>
  );
}
