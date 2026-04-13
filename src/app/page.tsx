import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { ShoppingCartIcon } from "@/components/shopping-cart-icon";
import { WelcomeAuthCard } from "@/components/welcome-auth-card";

export default async function Home() {
  const session = await getSessionFromCookies();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "CLIENT") {
    redirect(session.profileComplete ? "/painel" : "/completar-cadastro");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Faixa amarela — só o nome da marca, grande e em destaque */}
      <header className="flex min-h-[38vh] flex-col items-center justify-center bg-[var(--brand-yellow)] px-3 pb-8 pt-[max(3rem,env(safe-area-inset-top))] sm:min-h-[40vh] sm:px-6 sm:pb-10 sm:pt-16 md:min-h-[42vh]">
        <div className="mx-auto inline-flex max-w-[100vw] flex-col items-start px-1">
          <p className="mb-1 text-left text-sm font-bold uppercase tracking-[0.18em] text-white drop-shadow-sm sm:text-base sm:tracking-[0.18em] md:text-lg md:tracking-[0.22em]">
            Mercado
          </p>
          <h1 className="flex max-w-[100vw] flex-wrap items-center gap-x-2 gap-y-1 text-left text-[clamp(2rem,10vw,10rem)] font-extrabold leading-[1.05] tracking-tight text-[var(--brand-red)] sm:gap-x-4 sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] xl:leading-none">
            <span className="break-words">Sol do Recreio</span>
            <ShoppingCartIcon className="h-[0.9em] w-[0.9em] shrink-0 text-[var(--brand-red)] sm:h-[1em] sm:w-[1em]" />
          </h1>
        </div>
      </header>

      {/* Área branca — opções mais acima, com folga em relação ao amarelo e ao rodapé */}
      <main className="flex flex-1 flex-col items-center justify-start bg-white px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-10 text-[16px] sm:px-6 md:px-8 md:pb-16 md:pt-16 md:text-[17px]">
        <div className="w-full max-w-lg text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Bem-vindo
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Entre com Google, e-mail e senha ou crie sua conta de cliente em poucos passos.
          </p>
          <WelcomeAuthCard />
        </div>
      </main>
    </div>
  );
}
