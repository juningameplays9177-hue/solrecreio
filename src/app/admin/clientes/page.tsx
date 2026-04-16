import { AdminClientesTable } from "@/components/admin-clientes-table";
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

  const clients = rows.map((u) => ({
    id: Number(u.id),
    name: String(u.name),
    email: String(u.email),
    cashback_balance: Number(u.cashback_balance ?? 0),
  }));

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
          <AdminClientesTable clients={clients} />
        )}
      </div>
    </div>
  );
}
