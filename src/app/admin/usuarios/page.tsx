import { AdminUsersPanel } from "@/components/admin-users-panel";

export default function AdminUsuariosPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-1 sm:px-0">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="text-base font-medium text-[var(--accent)]">Usuários</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Usuários administradores
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-base text-[var(--muted)]">
            Crie outros admins e altere senhas. Não há exclusão pela interface — use o banco se
            precisar remover alguém.
          </p>
        </div>
        <div className="w-full text-left">
          <AdminUsersPanel />
        </div>
      </div>
    </div>
  );
}
