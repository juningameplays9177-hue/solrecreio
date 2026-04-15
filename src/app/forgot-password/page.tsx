import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getSessionFromCookies();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "CLIENT" && session.profileComplete) {
    redirect("/painel");
  }

  return <ForgotPasswordForm />;
}
