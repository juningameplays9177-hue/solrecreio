"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarShell } from "@/components/sidebar-shell";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <SidebarShell Sidebar={AdminSidebar}>{children}</SidebarShell>;
}
