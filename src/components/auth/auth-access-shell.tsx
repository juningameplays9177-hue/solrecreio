import Link from "next/link";

type AuthAccessShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  /** `light`: fundo branco e hierarquia visual para cadastro (marca âmbar/vermelho). */
  variant?: "dark" | "light";
};

export function AuthAccessShell({
  children,
  title,
  subtitle,
  footer,
  variant = "dark",
}: AuthAccessShellProps) {
  const isLight = variant === "light";
  const visualCards = isLight
    ? [
        {
          title: "Verão e praia",
          subtitle: "Ambiente claro e acolhedor",
          className:
            "from-amber-100/95 via-orange-50 to-red-100/80 border-amber-200/80",
        },
        {
          title: "Confiança",
          subtitle: "Cadastro rápido e seguro",
          className:
            "from-white via-amber-50 to-yellow-100/80 border-yellow-200/90",
        },
        {
          title: "Energia da marca",
          subtitle: "Âmbar e vermelho em destaque",
          className:
            "from-red-100/80 via-orange-50 to-amber-100/90 border-red-200/70",
        },
      ]
    : [
        {
          title: "Acesso seguro",
          subtitle: "Proteção em todas as etapas",
          className:
            "from-slate-900 via-slate-800 to-amber-950/90 border-white/10",
        },
        {
          title: "Painel completo",
          subtitle: "Gestão e cashback em um lugar",
          className:
            "from-[#1b1410] via-[#23180e] to-[#34170f] border-amber-300/20",
        },
      ];

  return (
    <div
      className={
        isLight
          ? "relative min-h-dvh overflow-x-hidden bg-white text-slate-900"
          : "relative min-h-dvh overflow-x-hidden bg-[#050508] text-slate-100"
      }
    >
      <div
        className={
          isLight
            ? "pointer-events-none absolute inset-0 opacity-100"
            : "pointer-events-none absolute inset-0 opacity-90"
        }
        aria-hidden
      >
        <div
          className={
            isLight
              ? "absolute -left-[18%] top-[-16%] h-[min(65vw,480px)] w-[min(65vw,480px)] rounded-full bg-[#fbc02d]/14 blur-[100px]"
              : "absolute -left-[20%] top-[-18%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full bg-[#fbc02d]/18 blur-[100px]"
          }
        />
        <div
          className={
            isLight
              ? "absolute -right-[12%] top-[8%] h-[min(58vw,420px)] w-[min(58vw,420px)] rounded-full bg-[#d32f2f]/10 blur-[100px]"
              : "absolute -right-[15%] top-[10%] h-[min(65vw,480px)] w-[min(65vw,480px)] rounded-full bg-[#d32f2f]/22 blur-[110px]"
          }
        />
        <div
          className={
            isLight
              ? "absolute bottom-[-18%] left-[18%] h-[min(75vw,520px)] w-[min(85vw,580px)] rounded-full bg-amber-100/35 blur-[110px]"
              : "absolute bottom-[-20%] left-[20%] h-[min(80vw,560px)] w-[min(90vw,640px)] rounded-full bg-indigo-600/10 blur-[120px]"
          }
        />
        <div
          className={
            isLight
              ? "absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(251,192,45,0.12),transparent_50%)]"
              : "absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]"
          }
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:flex-row lg:items-stretch lg:gap-12 lg:px-10 lg:pb-14 lg:pt-12">
        <header className="mb-8 flex flex-1 flex-col justify-center lg:mb-0 lg:max-w-md lg:pr-4">
          <Link
            href="/"
            className={
              isLight
                ? "mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                : "mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
            }
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#fbc02d] to-[#d32f2f] text-xs font-bold text-[#0a0a0f] shadow-lg shadow-black/30"
              aria-hidden
            >
              SR
            </span>
            Sol do Recreio
          </Link>
          <h1
            className={
              isLight
                ? "text-balance bg-gradient-to-r from-[#9a7209] via-[#fbc02d] to-[#c62828] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl lg:text-[2.35rem] lg:leading-tight"
                : "text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight"
            }
          >
            {title}
          </h1>
          <p
            className={
              isLight
                ? "mt-3 max-w-md text-pretty text-base leading-relaxed text-slate-600 sm:text-lg"
                : "mt-3 max-w-md text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
            }
          >
            {subtitle}
          </p>
          <p
            className={
              isLight
                ? "mt-6 text-sm leading-relaxed text-slate-600 lg:mt-8"
                : "mt-6 hidden text-sm leading-relaxed text-slate-500 lg:mt-8 lg:block"
            }
          >
            Acesso seguro com sessão criptografada. Suas credenciais são
            protegidas e nunca expostas no navegador.
          </p>

          <div
            className={
              isLight
                ? "mt-6 grid gap-3 sm:grid-cols-3"
                : "mt-6 hidden gap-3 sm:grid-cols-2 lg:grid"
            }
          >
            {visualCards.map((card) => (
              <div
                key={card.title}
                className={
                  isLight
                    ? `relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${card.className}`
                    : `relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 ${card.className}`
                }
              >
                <div
                  className={
                    isLight
                      ? "pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/45 blur-xl"
                      : "pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-300/15 blur-xl"
                  }
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p
                      className={
                        isLight
                          ? "text-sm font-semibold text-slate-800"
                          : "text-sm font-semibold text-amber-100"
                      }
                    >
                      {card.title}
                    </p>
                    <p
                      className={
                        isLight
                          ? "mt-1 text-xs text-slate-600"
                          : "mt-1 text-xs text-slate-300"
                      }
                    >
                      {card.subtitle}
                    </p>
                  </div>
                  <img
                    src="/pwa-icon.svg"
                    alt=""
                    className={
                      isLight
                        ? "h-10 w-10 rounded-xl border border-white/60 bg-white/70 p-1.5 shadow-sm"
                        : "h-10 w-10 rounded-xl border border-white/20 bg-white/10 p-1.5"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center lg:max-w-md lg:pl-2">
          <div
            className={
              isLight
                ? "rounded-2xl border border-amber-200/60 bg-white/90 p-6 shadow-[0_20px_60px_-18px_rgba(211,47,47,0.12),0_8px_32px_-12px_rgba(251,192,45,0.18)] ring-1 ring-amber-100/80 backdrop-blur-sm sm:p-8"
                : "rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-8"
            }
          >
            {children}
          </div>
          {footer ? (
            <div
              className={
                isLight
                  ? "mt-6 text-center text-sm text-slate-600"
                  : "mt-6 text-center text-sm text-slate-500"
              }
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
