import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-medium text-[var(--accent)]">Modo offline</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Sem conexao com a internet
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] sm:text-base">
          Verifique sua conexao e tente novamente. As areas com login e APIs precisam estar online.
        </p>
        <p className="mt-6">
          <Link
            href="/"
            className="touch-target inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Voltar ao inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
