"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminClienteRow = {
  id: number;
  name: string;
  email: string;
  cashback_balance: number;
};

function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function AdminClientesTable({ clients }: { clients: AdminClienteRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return clients;
    return clients.filter((c) => {
      const nameN = normalizeSearch(c.name);
      const emailN = c.email.toLowerCase();
      return nameN.includes(q) || emailN.includes(q);
    });
  }, [clients, query]);

  return (
    <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md sm:p-7 md:p-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Buscar cliente por nome</span>
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-base text-[var(--foreground)] outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </label>
        <p className="shrink-0 text-sm text-[var(--muted)]">
          {filtered.length === clients.length ? (
            <span>
              <span className="font-semibold tabular-nums text-[var(--foreground)]">
                {clients.length}
              </span>{" "}
              {clients.length === 1 ? "cliente" : "clientes"}
            </span>
          ) : (
            <span>
              <span className="font-semibold tabular-nums text-[var(--foreground)]">
                {filtered.length}
              </span>{" "}
              de{" "}
              <span className="tabular-nums">{clients.length}</span>{" "}
              {clients.length === 1 ? "cliente" : "clientes"}
            </span>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-slate-50/80 py-10 text-center">
          <p className="text-base text-[var(--muted)]">
            Nenhum cliente encontrado para &quot;{query.trim()}&quot;.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
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
              {filtered.map((u) => {
                const detailHref = `/admin/clientes/${u.id}`;
                return (
                  <tr key={u.id} className="border-b border-[var(--border)]/60">
                    <td className="p-4 font-medium">
                      <Link
                        href={detailHref}
                        className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="p-4 text-[var(--muted)]">
                      <Link
                        href={detailHref}
                        className="hover:text-[var(--accent)] hover:underline"
                      >
                        {u.email}
                      </Link>
                    </td>
                    <td className="p-4 whitespace-nowrap tabular-nums">
                      R${" "}
                      {u.cashback_balance.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
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
      )}
    </div>
  );
}
