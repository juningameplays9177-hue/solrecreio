import Link from "next/link";
import { getSessionFromCookies } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export default async function AdminHomePage() {
  const session = await getSessionFromCookies();

  let pendingNf = 0;
  let totalClients = 0;
  try {
    const pool = getPool();
    const [p] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM cashback_invoices WHERE status = 'PENDING'"
    );
    pendingNf = Number(p[0]?.c ?? 0);
    const [c] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM users WHERE role = 'CLIENT'"
    );
    totalClients = Number(c[0]?.c ?? 0);
  } catch {
    /* tabelas podem não existir */
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col items-center justify-center px-4 py-6 text-center sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-md sm:p-10 md:p-12 lg:max-w-4xl">
        <p className="text-base font-medium text-[var(--accent)]">Área administrativa</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Olá, {session?.name ?? "admin"}
        </h1>
        <p className="mt-3 break-words text-base text-[var(--muted)] md:text-lg">
          E-mail:{" "}
          <span className="text-[var(--foreground)]">{session?.email}</span>
        </p>

        <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-2 gap-4 md:mt-10 md:gap-6">
          <div className="rounded-2xl border border-[var(--border)] bg-slate-100 px-4 py-6 text-center md:py-8">
            <p className="text-4xl font-semibold tabular-nums text-[var(--brand-yellow)] md:text-5xl">
              {pendingNf}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] md:text-base">NF pendentes</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-slate-100 px-4 py-6 text-center md:py-8">
            <p className="text-4xl font-semibold tabular-nums text-[var(--brand-red)] md:text-5xl">
              {totalClients}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] md:text-base">Clientes</p>
          </div>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col items-stretch gap-4 md:mt-10">
          <Link
            href="/admin/cashback"
            className="touch-target inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-6 py-4 text-base font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Aprovação de NF
          </Link>
        </div>
      </div>
    </div>
  );
}
