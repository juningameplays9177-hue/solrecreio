import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { ClientShell } from "@/components/client-shell";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "ADMIN") {
    return <AdminShell>{children}</AdminShell>;
  }
  if (session.role === "CLIENT") {
    return <ClientShell>{children}</ClientShell>;
  }
  redirect("/login");
}
