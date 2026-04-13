"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export type SidebarShellSidebarProps = {
  open: boolean;
  onToggle: () => void;
  isMobileDrawer?: boolean;
};

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => true
  );
}

function MenuOpenIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SidebarShell({
  children,
  Sidebar,
}: {
  children: React.ReactNode;
  Sidebar: React.ComponentType<SidebarShellSidebarProps>;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [pathname, isDesktop]);

  const showDrawer = !isDesktop && sidebarOpen;
  const showMobileFab = !isDesktop && !sidebarOpen;

  return (
    <div className="relative flex min-h-dvh bg-white md:flex-row">
      {showDrawer && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showMobileFab && (
        <button
          type="button"
          aria-label="Abrir menu"
          className="touch-target fixed left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center justify-center rounded-xl border border-[var(--brand-red)]/35 bg-[var(--brand-yellow)] p-2.5 text-[var(--brand-red)] shadow-lg md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <MenuOpenIcon />
        </button>
      )}

      <div
        className={
          isDesktop
            ? "relative z-0 flex min-h-0 shrink-0"
            : `fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(18rem,calc(100vw-1rem))] max-w-[85vw] flex-col shadow-2xl transition-transform duration-200 ease-out md:relative md:z-0 md:w-auto md:max-w-none md:translate-x-0 md:shadow-none ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
        }
      >
        <Sidebar
          open={isDesktop ? sidebarOpen : true}
          onToggle={() => setSidebarOpen((o) => !o)}
          isMobileDrawer={!isDesktop}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${
          showMobileFab ? "pt-14" : ""
        } md:pt-0`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-3 py-6 text-[15px] leading-relaxed sm:px-4 sm:py-8 md:px-8 md:py-10 md:text-[1.0625rem] lg:px-10">
          <div className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]">{children}</div>
        </div>
      </div>
    </div>
  );
}
