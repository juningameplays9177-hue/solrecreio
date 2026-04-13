"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-16 text-center text-slate-100">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Ocorreu um erro ao carregar esta página
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          Tente atualizar. Se voltar a acontecer, limpe o cache do site ou abra em
          janela anónima. Utilizadores com app instalada: desligue o modo offline
          temporariamente.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <pre className="max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-red-200">
            {error.message}
          </pre>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Ir ao início
        </Link>
      </div>
    </div>
  );
}
