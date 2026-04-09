"use client";

import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarShell } from "@/components/sidebar-shell";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <SidebarShell Sidebar={ClientSidebar}>{children}</SidebarShell>;
}
