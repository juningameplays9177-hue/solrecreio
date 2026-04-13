import Link from "next/link";

type AuthAccessShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
};

export function AuthAccessShell({
  children,
  title,
  subtitle,
  footer,
}: AuthAccessShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#050508] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-[20%] top-[-18%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full bg-[#fbc02d]/18 blur-[100px]" />
        <div className="absolute -right-[15%] top-[10%] h-[min(65vw,480px)] w-[min(65vw,480px)] rounded-full bg-[#d32f2f]/22 blur-[110px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[min(80vw,560px)] w-[min(90vw,640px)] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:flex-row lg:items-stretch lg:gap-12 lg:px-10 lg:pb-14 lg:pt-12">
        <header className="mb-8 flex flex-1 flex-col justify-center lg:mb-0 lg:max-w-md lg:pr-4">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#fbc02d] to-[#d32f2f] text-xs font-bold text-[#0a0a0f] shadow-lg shadow-black/30"
              aria-hidden
            >
              SR
            </span>
            Sol do Recreio
          </Link>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
            {subtitle}
          </p>
          <p className="mt-8 hidden text-sm leading-relaxed text-slate-500 lg:block">
            Acesso seguro com sessão criptografada. Suas credenciais são
            protegidas e nunca expostas no navegador.
          </p>
        </header>

        <div className="flex flex-1 flex-col justify-center lg:max-w-md lg:pl-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-8">
            {children}
          </div>
          {footer ? (
            <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
