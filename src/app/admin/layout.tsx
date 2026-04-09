import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "ADMIN") {
    redirect("/entrar?motivo=admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
