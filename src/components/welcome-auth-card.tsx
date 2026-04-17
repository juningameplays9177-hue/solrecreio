"use client";

import Link from "next/link";

export function WelcomeAuthCard() {
  return (
    <div className="mt-10 w-full max-w-lg sm:mt-12">
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="touch-target flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-4 text-base font-semibold text-white shadow-md transition-[transform,background-color,box-shadow] duration-200 hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.99]"
        >
          Entrar com e-mail
        </Link>
        <Link
          href="/register"
          className="touch-target flex w-full items-center justify-center rounded-2xl border-2 border-slate-900/10 bg-white px-5 py-4 text-base font-semibold text-slate-900 transition-[transform,background-color,border-color] duration-200 hover:border-slate-900/20 hover:bg-slate-50 active:scale-[0.99]"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
