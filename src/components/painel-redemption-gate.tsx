"use client";

import Link from "next/link";
import { PainelCashbackRedemptionForm } from "@/components/painel-cashback-redemption-form";

export function PainelRedemptionGate({
  profileComplete,
  availableBalance,
}: {
  profileComplete: boolean;
  availableBalance: number;
}) {
  if (profileComplete) {
    return <PainelCashbackRedemptionForm availableBalance={availableBalance} />;
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-dashed border-[var(--accent)]/40 bg-amber-50/60 p-4 sm:p-5">
      <p className="text-sm font-medium text-[var(--accent)]">Resgatar cashback em cupom</p>
      <p className="text-sm leading-relaxed text-[var(--foreground)]">
        Para solicitar resgate, é necessário{" "}
        <strong>concluir o cadastro</strong> com CPF e telefone (WhatsApp) válidos no painel.
      </p>
      <p className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
        Saldo atual:{" "}
        <strong className="text-[var(--foreground)]">
          R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </strong>
        {" — "}
        após completar seus dados, você poderá pedir o resgate a partir de{" "}
        <strong className="text-[var(--foreground)]">R$ 10,00</strong>.
      </p>
      <Link
        href="#completar-cadastro-painel"
        className="touch-target inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--accent)] hover:bg-amber-50/90"
      >
        Ir para terminar o cadastro
      </Link>
    </div>
  );
}
