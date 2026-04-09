"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type N = {
  id: number;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function ClientNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : null);
      return;
    }
    setItems(data.notifications ?? []);
    setUnread(Number(data.unreadCount ?? 0));
    setError(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await load();
    router.refresh();
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    await load();
    router.refresh();
  }

  if (error) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Notificações indisponíveis. Rode{" "}
        <code className="rounded bg-slate-200 px-1">npm.cmd run db:migrate-admin-features</code>
      </p>
    );
  }

  return (
    <div className="relative rounded-xl border border-[var(--border)] bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
        >
          Notificações
          {unread > 0 && (
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {items.some((i) => !i.read_at) && (
          <button
            type="button"
            onClick={markAll}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto border-t border-[var(--border)] pt-3">
          {items.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">Nenhuma notificação.</li>
          ) : (
            items.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read_at
                    ? "border-transparent opacity-80"
                    : "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                }`}
              >
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="mt-1 text-xs text-[var(--muted)]">{n.body}</p>}
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
                {!n.read_at && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="mt-2 text-xs text-[var(--accent)] hover:underline"
                  >
                    Marcar como lida
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
