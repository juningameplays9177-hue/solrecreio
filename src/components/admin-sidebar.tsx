"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";




const items: { href: string; label: string }[] = [

  { href: "/admin", label: "Início" },

  { href: "/admin/cashback", label: "Aprovação de NF" },

  { href: "/admin/clientes", label: "Clientes" },

  { href: "/admin/usuarios", label: "Usuario ADM" },

  { href: "/admin/configuracao", label: "Configuração" },

];



function MenuIcon() {

  return (

    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>

      <path

        d="M4 6h16M4 12h16M4 18h16"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

      />

    </svg>

  );

}



function ChevronLeftIcon() {

  return (

    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>

      <path

        d="M15 6l-6 6 6 6"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}



export function AdminSidebar({

  open,

  onToggle,

  isMobileDrawer = false,

}: {

  open: boolean;

  onToggle: () => void;

  isMobileDrawer?: boolean;

}) {

  const pathname = usePathname();



  return (

    <aside

      className={`flex min-h-0 shrink-0 flex-col border-b border-black/10 bg-[var(--brand-yellow)] transition-[width] duration-200 ease-out md:min-h-dvh md:border-b-0 md:border-r ${

        isMobileDrawer ? "h-full min-h-[100dvh] w-full" : ""

      } ${open ? "w-full md:w-64" : "w-full md:w-[3.25rem]"}`}

    >

      <div className="flex flex-col items-center gap-2 border-b border-black/10 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:min-h-[3.5rem] md:py-4">

        <button

          type="button"

          onClick={onToggle}

          aria-expanded={open}

          aria-label={open ? "Fechar menu lateral" : "Abrir menu lateral"}

          className="touch-target flex shrink-0 items-center justify-center rounded-lg border border-[var(--brand-red)]/35 bg-white/50 text-[var(--brand-red)] shadow-sm transition hover:bg-white/70"

        >

          {open ? <ChevronLeftIcon /> : <MenuIcon />}

        </button>

        {open && (

          <div className="w-full text-center">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/95">

              Admin

            </p>

            <p className="mt-0.5 text-sm font-bold text-[var(--brand-red)] sm:text-base">

              Sol do Recreio

            </p>

          </div>

        )}

      </div>

      {open && (

        <>

          <nav className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overscroll-contain px-3 pt-3">

            {items.map((item) => {

              const active =

                item.href === "/admin"

                  ? pathname === "/admin"

                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (

                <Link

                  key={item.href}

                  href={item.href}

                  className={`touch-target flex w-full max-w-[15rem] items-center justify-center rounded-xl px-4 py-3 text-center text-[15px] font-semibold leading-snug transition md:text-base ${

                    active

                      ? "bg-[var(--brand-red)]/15 text-[var(--brand-red)] shadow-sm ring-1 ring-[var(--brand-red)]/30"

                      : "text-[var(--brand-red)]/92 hover:bg-white/40 hover:text-[var(--brand-red)]"

                  }`}

                >

                  {item.label}

                </Link>

              );

            })}

          </nav>

          <div className="mt-auto shrink-0 border-t border-black/10 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">

            <form action="/api/auth/logout" method="post" className="flex justify-center">

              <button

                type="submit"

                className="touch-target w-full max-w-[15rem] rounded-xl border-2 border-[var(--brand-red)] bg-white/45 px-4 py-3 text-center text-[15px] font-semibold text-[var(--brand-red)] hover:bg-white/65 md:text-base"

              >

                Sair

              </button>

            </form>

          </div>

        </>

      )}

    </aside>

  );

}

