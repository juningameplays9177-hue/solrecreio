import Link from "next/link";
import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import { ensureCashbackRedemptionsSchema } from "@/lib/cashback-redemptions";
import type { RowDataPacket } from "mysql2";

type Props = { params: Promise<{ id: string }> };

export default async function AdminClienteDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const userId = Number(idParam);
  if (!Number.isFinite(userId) || userId <= 0) notFound();

  const pool = getPool();
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, email, cpf, phone, cashback_balance FROM users WHERE id = ? AND role = 'CLIENT' LIMIT 1",
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
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
          <p className="text-sm text-[var(--muted)]">{String(user.email)}</p>
          {user.cpf && (
            <p className="mt-1 text-xs text-[var(--muted)]">CPF: {String(user.cpf)}</p>
          )}
          <p className="mt-4 text-lg">
            Saldo cashback:{" "}
            <span className="font-semibold text-[var(--accent)]">
              R$ {bal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <h2 className="mt-8 text-center text-lg font-medium">Histórico de solicitações</h2>
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
