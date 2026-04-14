import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

export default async function MercadoPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");
  if (!session.profileComplete) redirect("/completar-cadastro");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Mercado
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Olá, {session.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          Cadastro concluído com sucesso. Bem-vindo ao mercado — o acesso foi liberado sem
          depender de consulta ao MySQL no primeiro carregamento.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/painel"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
          >
            Ir para o painel
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-[var(--accent)]"
          >
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
