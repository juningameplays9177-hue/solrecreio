import { AdminConfigForm } from "@/components/admin-config-form";

export default function AdminConfigPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[var(--accent)]">Configuração</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Parâmetros
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-base text-[var(--muted)]">
            Defina a porcentagem de cashback aplicada ao aprovar notas fiscais.
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md sm:p-7 md:p-8">
          <AdminConfigForm />
        </div>
      </div>
    </div>
  );
}
