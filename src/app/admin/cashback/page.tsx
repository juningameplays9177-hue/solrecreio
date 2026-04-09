import Link from "next/link";
import { getPool } from "@/lib/db";
import { getCashbackPercentage } from "@/lib/app-settings";
import { AdminCashbackTable } from "@/components/admin-cashback-table";
import type { RowDataPacket } from "mysql2";

export default async function AdminCashbackPage() {
  let invoices: RowDataPacket[] = [];
  let dbError: string | null = null;
  let percentage = 10;

  try {
    const pool = getPool();
    percentage = await getCashbackPercentage(pool);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.id, i.user_id, i.amount, i.credited_amount, i.status, i.original_filename, i.created_at,
              u.name AS user_name, u.email AS user_email
       FROM cashback_invoices i
       JOIN users u ON u.id = i.user_id
       ORDER BY
         CASE WHEN i.status = 'PENDING' THEN 0 ELSE 1 END,
         i.created_at DESC
       LIMIT 200`
    );
    invoices = rows;
  } catch (e) {
    console.error("admin/cashback:", e);
    dbError =
      "Não foi possível carregar as notas fiscais. Verifique a conexão com o MySQL e se a tabela cashback_invoices existe (migração do projeto).";
  }

  const serialized = invoices.map((row) => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    amount: String(row.amount),
    credited_amount:
      row.credited_amount == null ? null : String(row.credited_amount),
    status: String(row.status),
    original_filename:
      row.original_filename == null ? null : String(row.original_filename),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    user_name: String(row.user_name),
    user_email: String(row.user_email),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[var(--accent)]">Cashback</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Aprovação de NF
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-base text-[var(--muted)]">
            Ao aprovar, o cliente recebe{" "}
            <strong className="text-[var(--foreground)]">{percentage}%</strong> do valor
            informado na nota como cashback. O percentual pode ser alterado em{" "}
            <Link
              href="/admin/configuracao"
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Configuração
            </Link>
            .
          </p>
        </div>

        {dbError ? (
          <p className="text-center text-base text-[var(--error)]">{dbError}</p>
        ) : (
          <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md text-left sm:p-7 md:p-8">
            <AdminCashbackTable invoices={serialized} cashbackPercentage={percentage} />
          </div>
        )}
      </div>
    </div>
  );
}
