import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionFromCookies } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSessionFromCookies();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "CLIENT") {
    redirect(session.profileComplete ? "/painel" : "/completar-cadastro");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#050508] text-slate-400">
          Carregando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
