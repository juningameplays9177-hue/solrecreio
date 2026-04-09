import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { ClientNotifications } from "@/components/client-notifications";
import { PainelCashbackForm } from "@/components/painel-cashback-form";
import type { RowDataPacket } from "mysql2";

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
    redirect("/entrar");
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
    redirect("/entrar");
  }

  const userId = Number(session.sub);
  let balance = 0;
  let invoices: RowDataPacket[] = [];
  let dbError: string | null = null;

  try {
    const pool = getPool();
    const [balRows] = await pool.query<RowDataPacket[]>(
      "SELECT cashback_balance FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    balance = Number(balRows[0]?.cashback_balance ?? 0);

    const [invRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, amount, status, original_filename, created_at
       FROM cashback_invoices WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );
    invoices = invRows;
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

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-slate-100 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Saldo de cashback
          </p>
          <p className="mt-1 text-3xl font-semibold text-[var(--accent)] sm:text-4xl">
            {dbError ? "—" : `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
          {dbError && <p className="mt-2 text-sm text-[var(--error)]">{dbError}</p>}
        </div>

        {!dbError && (
          <>
            <div className="mt-6">
              <ClientNotifications />
            </div>
            <PainelCashbackForm />
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
          </>
        )}

        <p className="mt-8 text-center text-xs text-[var(--muted)] sm:text-sm">
          Use o menu à esquerda para ir ao site ou sair da conta.
        </p>
      </div>
    </div>
  );
}
