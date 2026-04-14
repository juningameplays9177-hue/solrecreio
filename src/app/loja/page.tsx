import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

export default async function LojaPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");
  if (!session.profileComplete) redirect("/completar-cadastro");
  redirect("/painel");
}
