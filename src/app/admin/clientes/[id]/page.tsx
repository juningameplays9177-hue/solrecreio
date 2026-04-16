import Link from "next/link";
import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import { ensureCashbackRedemptionsSchema } from "@/lib/cashback-redemptions";
import type { RowDataPacket } from "mysql2";

type Props = { params: Promise<{ id: string }> };

function formatCpfBr(digits: string | null | undefined): string {
  if (!digits) return "—";
  const c = String(digits).replace(/\D/g, "");
  if (c.length !== 11) return String(digits);
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatPhoneBr(d: string | null | undefined): string {
  if (!d) return "—";
  const n = String(d).replace(/\D/g, "");
  if (n.length < 10) return String(d);
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default async function AdminClienteDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const userId = Number(idParam);
  if (!Number.isFinite(userId) || userId <= 0) notFound();

  const pool = getPool();
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, cpf, phone, cashback_balance, created_at
     FROM users WHERE id = ? AND role = 'CLIENT' LIMIT 1`,
    [userId]
  );
  const user = users[0];
  if (!user) notFound();

  const [invoices] = await pool.query<RowDataPacket[]>(
    `SELECT id, amount, credited_amount, status, original_filename, created_at, reviewed_at, admin_note
     FROM cashback_invoices WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  await ensureCashbackRedemptionsSchema(pool);
  const [redemptions] = await pool.query<RowDataPacket[]>(
    `SELECT id, amount, status, coupon_code, created_at, reviewed_at, admin_note
     FROM cashback_redemptions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  const bal = Number(user.cashback_balance ?? 0);
  const createdRaw = user.created_at;
  const createdAtStr =
    createdRaw instanceof Date
      ? createdRaw.toLocaleString("pt-BR")
      : createdRaw
        ? new Date(String(createdRaw)).toLocaleString("pt-BR")
        : "—";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="text-center">
          <Link
            href="/admin/clientes"
            className="inline-block text-sm text-[var(--accent)] hover:underline"
          >
            ← Voltar a clientes
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {String(user.name)}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">ID interno: {String(user.id)}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <h2 className="text-center text-base font-semibold text-slate-900">
            Dados cadastrais
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-center text-xs text-[var(--muted)]">
            Informações registradas na conta do cliente (sem senha).
          </p>
          <dl className="mx-auto mt-6 grid max-w-lg gap-3 text-sm sm:grid-cols-1">
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">Nome completo</dt>
              <dd className="text-[var(--foreground)]">{String(user.name)}</dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">E-mail</dt>
              <dd className="break-all text-[var(--foreground)]">{String(user.email)}</dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">CPF</dt>
              <dd className="tabular-nums text-[var(--foreground)]">
                {formatCpfBr(user.cpf == null ? null : String(user.cpf))}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">Telefone</dt>
              <dd className="tabular-nums text-[var(--foreground)]">
                {formatPhoneBr(user.phone == null ? null : String(user.phone))}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">Data de cadastro</dt>
              <dd className="text-[var(--foreground)]">{createdAtStr}</dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">Saldo de cashback</dt>
              <dd className="font-semibold tabular-nums text-[var(--accent)]">
                R$ {bal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </dd>
            </div>
          </dl>
        </div>

        <h2 className="mt-10 text-center text-lg font-medium">Histórico de solicitações</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-center text-sm text-[var(--muted)]">Nenhuma solicitação.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-left">
            {invoices.map((inv) => {
              const st = String(inv.status);
              const amt = Number(inv.amount);
              const cred =
                inv.credited_amount != null ? Number(inv.credited_amount) : null;
              const dt = inv.created_at
                ? new Date(inv.created_at as string).toLocaleString("pt-BR")
                : "";
              return (
                <li
                  key={Number(inv.id)}
                  className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Valor informado: R${" "}
                      {amt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={
                        st === "PENDING"
                          ? "text-[var(--brand-yellow)]"
                          : st === "APPROVED"
                            ? "text-[var(--brand-red)]"
                            : "text-[var(--brand-red)]"
                      }
                    >
                      {st === "PENDING"
                        ? "Pendente"
                        : st === "APPROVED"
                          ? `Aprovado · crédito R$ ${cred?.toFixed(2)}`
                          : "Recusado"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{dt}</p>
                  {inv.admin_note && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Obs.: {String(inv.admin_note)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <h2 className="mt-8 text-center text-lg font-medium">Resgates e cupons</h2>
        {redemptions.length === 0 ? (
          <p className="mt-2 text-center text-sm text-[var(--muted)]">Nenhum resgate ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-left">
            {redemptions.map((item) => {
              const amount = Number(item.amount);
              const created = item.created_at
                ? new Date(item.created_at as string).toLocaleString("pt-BR")
                : "";
              return (
                <li
                  key={Number(item.id)}
                  className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Resgate: R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[var(--brand-red)]">{String(item.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{created}</p>
                  {item.coupon_code && (
                    <p className="mt-1 text-xs font-mono text-emerald-700">
                      Cupom: {String(item.coupon_code)}
                    </p>
                  )}
                  {item.admin_note && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Obs.: {String(item.admin_note)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
