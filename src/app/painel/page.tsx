import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { ClientNotifications } from "@/components/client-notifications";
import { PainelProfileCompletionCard } from "@/components/painel-profile-completion-card";
import { PainelCashbackForm } from "@/components/painel-cashback-form";
import { PainelCashbackRedemptionForm } from "@/components/painel-cashback-redemption-form";
import { CashbackRedemptionsList } from "@/components/cashback-redemptions-list";
import { PainelCashbackWallet } from "@/components/painel-cashback-wallet";
import { ensureCashbackRedemptionsSchema } from "@/lib/cashback-redemptions";
import type { RowDataPacket } from "mysql2";

function formatCpfBr(digits: string | null | undefined): string | null {
  if (!digits) return null;
  const c = String(digits).replace(/\D/g, "");
  if (c.length !== 11) return digits;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatPhoneDigits(d: string | null | undefined): string | null {
  if (!d) return null;
  const n = String(d).replace(/\D/g, "");
  if (n.length < 10) return d;
  if (n.length === 10)
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function statusBadge(status: string) {
  const y = "border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/35 text-[var(--brand-red)]";
  const r = "border-[var(--brand-red)] bg-[var(--brand-red)]/12 text-[var(--brand-red)]";
  if (status === "PENDING")
    return (
      <span className={`rounded-lg border px-2 py-0.5 text-xs ${y}`}>
        Pendente
      </span>
    );
  if (status === "APPROVED")
    return (
      <span className={`rounded-lg border px-2 py-0.5 text-xs ${r}`}>
        Aprovado
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className={`rounded-lg border px-2 py-0.5 text-xs ${r}`}>
        Recusado
      </span>
    );
  return status;
}

export default async function PainelPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="sticky top-0 z-20 mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--brand-red)]/30 bg-[var(--brand-yellow)]/25 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--brand-red)]">
            Você está na área do cliente como administrador
          </p>
          <Link
            href="/admin"
            className="touch-target inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Voltar ao painel admin
          </Link>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-md sm:p-8 md:p-10">
          <p className="text-base font-medium text-[var(--accent)]">Painel do cliente</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Olá, administrador
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Saldo, envio de nota fiscal e histórico são exibidos apenas para usuários com perfil de
            cliente. Use a área administrativa para aprovar NFs e gerenciar cadastros.
          </p>
          <p className="mt-6">
            <Link
              href="/"
              className="touch-target inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
            >
              Abrir site público (início)
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (session.role !== "CLIENT") {
    redirect("/login");
  }

  const userId = Number(session.sub);
  let balance = 0;
  let dbCpf: string | null = null;
  let dbPhone: string | null = null;
  let invoices: RowDataPacket[] = [];
  let redemptions: RowDataPacket[] = [];
  let dbError: string | null = null;

  try {
    const pool = getPool();
    const [balRows] = await pool.query<RowDataPacket[]>(
      "SELECT cashback_balance, cpf, phone FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    balance = Number(balRows[0]?.cashback_balance ?? 0);
    dbCpf =
      balRows[0]?.cpf == null || balRows[0]?.cpf === ""
        ? null
        : String(balRows[0].cpf);
    dbPhone =
      balRows[0]?.phone == null || balRows[0]?.phone === ""
        ? null
        : String(balRows[0].phone);

    const [invRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, amount, status, original_filename, created_at
       FROM cashback_invoices WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );
    invoices = invRows;

    await ensureCashbackRedemptionsSchema(pool);
    const [redemptionRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, amount, status, coupon_code, admin_note, created_at, reviewed_at
       FROM cashback_redemptions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );
    redemptions = redemptionRows;
  } catch {
    dbError =
      "Banco desatualizado: rode no terminal npm.cmd run db:migrate-cashback e reinicie o app.";
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-md sm:p-8 md:p-10">
        <p className="text-base font-medium text-[var(--accent)]">Área do cliente</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Olá, {session.name}
        </h1>
        <p className="mt-3 break-words text-sm text-[var(--muted)] sm:text-base">
          E-mail: <span className="text-[var(--foreground)]">{session.email}</span>
        </p>
        {session.profileComplete ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)]">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Dados da conta
            </p>
            <p className="mt-1">
              CPF:{" "}
              <span className="font-medium">{formatCpfBr(dbCpf) ?? "—"}</span>
            </p>
            <p className="mt-0.5">
              Telefone:{" "}
              <span className="font-medium">{formatPhoneDigits(dbPhone) ?? "—"}</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              Com login Google, nome e e-mail seguem a conta Google. A palavra-passe é gerida pelo
              Google — volte a entrar com o botão Continuar com Google, ou com e-mail e senha se
              criou palavra-passe no cadastro.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Entrou com Google? O <strong className="text-[var(--foreground)]">nome</strong> e o{" "}
              <strong className="text-[var(--foreground)]">e-mail</strong> vêm da sua conta Google.
              Complete <strong className="text-[var(--foreground)]">CPF</strong> e{" "}
              <strong className="text-[var(--foreground)]">telefone</strong> abaixo para usar o
              cashback.               Não armazenamos a palavra-passe Google — use de novo o botão Continuar com Google
              para entrar.
            </p>
            <PainelProfileCompletionCard />
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-slate-100 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Saldo de cashback
          </p>
          <p className="mt-1 text-3xl font-semibold text-[var(--accent)] sm:text-4xl">
            {dbError ? "—" : `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
          {dbError && <p className="mt-2 text-sm text-[var(--error)]">{dbError}</p>}
        </div>

        {!dbError && session.profileComplete && (
          <>
            <div className="mt-6">
              <ClientNotifications />
            </div>
            <div className="mt-6">
              <PainelCashbackWallet />
            </div>
            <PainelCashbackForm />
            <PainelCashbackRedemptionForm availableBalance={balance} />
            <div className="mt-8">
              <p className="text-sm font-medium text-[var(--foreground)] sm:text-base">
                Suas solicitações
              </p>
              {invoices.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">Nenhuma solicitação ainda.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {invoices.map((row) => {
                    const id = Number(row.id);
                    const amount = Number(row.amount);
                    const st = String(row.status);
                    const created = row.created_at
                      ? new Date(row.created_at as string).toLocaleString("pt-BR")
                      : "";
                    return (
                      <li
                        key={id}
                        className="flex flex-col gap-1 rounded-lg border border-[var(--border)]/80 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span>
                          R${" "}
                          {amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          · {created}
                        </span>
                        {statusBadge(st)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-8">
              <p className="text-sm font-medium text-[var(--foreground)] sm:text-base">
                Seus resgates e cupons
              </p>
              <CashbackRedemptionsList
                redemptions={redemptions.map((row) => ({
                  id: Number(row.id),
                  amount: Number(row.amount),
                  status: String(row.status),
                  coupon_code: row.coupon_code == null ? null : String(row.coupon_code),
                  admin_note: row.admin_note == null ? null : String(row.admin_note),
                  created_at:
                    row.created_at instanceof Date
                      ? row.created_at.toISOString()
                      : String(row.created_at),
                  reviewed_at:
                    row.reviewed_at instanceof Date
                      ? row.reviewed_at.toISOString()
                      : row.reviewed_at == null
                        ? null
                        : String(row.reviewed_at),
                }))}
              />
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-[var(--muted)] sm:text-sm">
          Use o menu à esquerda para ir ao site ou sair da conta.
        </p>
      </div>
    </div>
  );
}
