import { getPool } from "@/lib/db";
import { ensureCashbackRedemptionsSchema } from "@/lib/cashback-redemptions";
import { AdminRedemptionsTable } from "@/components/admin-redemptions-table";
import type { RowDataPacket } from "mysql2";

export default async function AdminResgatesPage() {
  let redemptions: RowDataPacket[] = [];
  let dbError: string | null = null;

  try {
    const pool = getPool();
    await ensureCashbackRedemptionsSchema(pool);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.user_id, r.amount, r.status, r.coupon_code, r.admin_note, r.created_at, r.reviewed_at,
              u.name AS user_name, u.email AS user_email
       FROM cashback_redemptions r
       JOIN users u ON u.id = r.user_id
       ORDER BY
         CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
         r.created_at DESC
       LIMIT 200`
    );
    redemptions = rows;
  } catch (e) {
    console.error("admin/resgates:", e);
    dbError = "Nao foi possivel carregar os pedidos de resgate.";
  }

  const serialized = redemptions.map((row) => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    amount: Number(row.amount),
    status: String(row.status),
    coupon_code: row.coupon_code == null ? null : String(row.coupon_code),
    admin_note: row.admin_note == null ? null : String(row.admin_note),
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    reviewed_at:
      row.reviewed_at instanceof Date
        ? row.reviewed_at.toISOString()
        : row.reviewed_at == null
          ? null
          : String(row.reviewed_at),
    user_name: String(row.user_name),
    user_email: String(row.user_email),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[var(--accent)]">Cashback</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Resgates por cupom
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-base text-[var(--muted)]">
            O cliente pede o resgate no painel e o cupom e gerado automaticamente quando voce
            aprova.
          </p>
        </div>

        {dbError ? (
          <p className="text-center text-base text-[var(--error)]">{dbError}</p>
        ) : (
          <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-md sm:p-7 md:p-8">
            <AdminRedemptionsTable redemptions={serialized} />
          </div>
        )}
      </div>
    </div>
  );
}
