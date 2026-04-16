import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await getSessionFromCookies();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "CLIENT") {
    redirect("/painel");
  }

  return <RegisterForm />;
}
