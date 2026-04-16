import Link from "next/link";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export default async function AdminClientesPage() {
  let rows: RowDataPacket[] = [];
  let dbError: string | null = null;

  try {
    const pool = getPool();
    const [r] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, cpf, phone, cashback_balance, created_at
       FROM users WHERE role = 'CLIENT' ORDER BY name ASC`
    );
    rows = r;
  } catch {
    dbError = "Não foi possível carregar clientes (confira o MySQL e as migrações).";
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[var(--accent)]">Clientes</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Clientes cadastrados
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-base text-[var(--muted)]">
            Saldo de cashback e histórico de notas por cliente.
          </p>
        </div>

        {dbError ? (
          <p className="text-center text-base text-[var(--error)]">{dbError}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-md">
            <p className="text-base text-[var(--muted)]">Nenhum cliente ainda.</p>
          </div>
        ) : (
          <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md sm:p-7 md:p-8">
            <div className="scroll-touch overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
              <table className="w-full min-w-[700px] text-left text-base">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-slate-100">
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold">E-mail</th>
                    <th className="p-4 font-semibold">Saldo cashback</th>
                    <th className="p-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const id = Number(u.id);
                    const bal = Number(u.cashback_balance ?? 0);
                    const detailHref = `/admin/clientes/${id}`;
                    return (
                      <tr key={id} className="border-b border-[var(--border)]/60">
                        <td className="p-4 font-medium">
                          <Link
                            href={detailHref}
                            className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline"
                          >
                            {String(u.name)}
                          </Link>
                        </td>
                        <td className="p-4 text-[var(--muted)]">
                          <Link
                            href={detailHref}
                            className="hover:text-[var(--accent)] hover:underline"
                          >
                            {String(u.email)}
                          </Link>
                        </td>
                        <td className="p-4 whitespace-nowrap tabular-nums">
                          R$ {bal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <Link
                            href={detailHref}
                            className="text-base font-medium text-[var(--accent)] hover:underline"
                          >
                            Ver ficha completa
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
