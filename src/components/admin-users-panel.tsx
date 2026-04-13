"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminRow = { id: number; name: string; email: string; created_at: string };

export function AdminUsersPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwById, setPwById] = useState<Record<number, string>>({});

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro");
      return;
    }
    setUsers(data.users ?? []);
    setError(null);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      await load();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(id: number) {
    const pw = pwById[id]?.trim();
    if (!pw || pw.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro");
        return;
      }
      setPwById((m) => ({ ...m, [id]: "" }));
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={createUser}
        className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md sm:p-7 md:p-8"
      >
        <p className="text-base font-medium text-[var(--accent)]">Novo administrador</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <input
            required
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base"
          />
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base"
          />
          <input
            required
            type="password"
            placeholder="Senha inicial"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Criar usuário
        </button>
      </form>

      {error && (
        <p className="text-center text-base text-[var(--error)]" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md sm:p-7 md:p-8">
        <p className="text-base font-semibold text-slate-900">Administradores</p>
        <div className="scroll-touch mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[620px] text-left text-base">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-100">
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">E-mail</th>
                <th className="p-4 font-semibold">Nova senha</th>
                <th className="p-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/60">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-[var(--muted)]">{u.email}</td>
                  <td className="p-4">
                    <input
                      type="password"
                      placeholder="••••"
                      value={pwById[u.id] ?? ""}
                      onChange={(e) =>
                        setPwById((m) => ({ ...m, [u.id]: e.target.value }))
                      }
                      className="w-full min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                    />
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => changePassword(u.id)}
                      className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50"
                    >
                      Salvar senha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
