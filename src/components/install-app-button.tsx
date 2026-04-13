"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopOs, setDesktopOs] = useState<"windows" | "mac" | "other">("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [needsActivationReload, setNeedsActivationReload] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const mobile = /android|iphone|ipad|ipod/.test(ua);
    const platform = window.navigator.platform.toLowerCase();
    const os = platform.includes("win")
      ? "windows"
      : platform.includes("mac")
        ? "mac"
        : "other";
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setIsIos(ios);
    setIsMobile(mobile);
    setDesktopOs(os);
    setIsStandalone(standalone);
    setNeedsActivationReload("serviceWorker" in navigator && !navigator.serviceWorker.controller);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setShowManualHint(false);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function downloadDesktopShortcut() {
    const url = window.location.origin;
    let content = "";
    let filename = "Sol-do-Recreio";
    let mimeType = "text/plain;charset=utf-8";

    if (desktopOs === "windows") {
      content = `[InternetShortcut]\r\nURL=${url}\r\n`;
      filename += ".url";
    } else if (desktopOs === "mac") {
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n  <key>URL</key>\n  <string>${url}</string>\n</dict>\n</plist>\n`;
      filename += ".webloc";
      mimeType = "application/xml;charset=utf-8";
    } else {
      content = `${url}\n`;
      filename += ".txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    setShowManualHint(true);
  }

  async function install() {
    if (!isMobile) {
      downloadDesktopShortcut();
      return;
    }

    if (needsActivationReload && "serviceWorker" in navigator) {
      setLoading(true);
      try {
        await navigator.serviceWorker.ready;
      } finally {
        window.location.reload();
      }
      return;
    }

    if (!deferredPrompt) {
      setShowManualHint(true);
      return;
    }

    setLoading(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } finally {
      setLoading(false);
    }
  }

  if (isStandalone) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-left">
        <p className="text-sm font-semibold text-emerald-950">Aplicativo ja instalado</p>
        <p className="mt-1 text-xs text-emerald-900 sm:text-sm">
          O Sol do Recreio ja pode ser aberto como aplicativo nesta tela.
        </p>
      </div>
    );
  }

  const canPromptInstall = deferredPrompt !== null;

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Instalar aplicativo</p>
          <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
            {isMobile
              ? "Adicione o Sol do Recreio na tela inicial para abrir como app."
              : "Baixe um atalho do Sol do Recreio para colocar na area de trabalho."}
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={loading}
          className="touch-target inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-60"
        >
          {loading
            ? "Preparando..."
            : !isMobile
              ? "Baixar atalho"
              : needsActivationReload
              ? "Ativar instalacao"
              : canPromptInstall
                ? "Instalar app"
                : "Adicionar a tela inicial"}
        </button>
      </div>
      {showManualHint && (
        <p className="mt-3 text-xs text-[var(--muted)] sm:text-sm">
          {!isMobile ? (
            <>
              O arquivo foi baixado. Abra o download e mova o atalho para a area de trabalho ou
              para a pasta que voce quiser usar como acesso rapido.
            </>
          ) : isIos ? (
            <>
              No iPhone/iPad, toque no botao <strong className="text-[var(--foreground)]">Compartilhar</strong> do Safari e depois em{" "}
              <strong className="text-[var(--foreground)]">Adicionar a Tela de Inicio</strong>.
            </>
          ) : (
            <>
              Se o navegador nao mostrar a instalacao automaticamente, use o menu do navegador e escolha
              <strong className="text-[var(--foreground)]"> Instalar app</strong> ou{" "}
              <strong className="text-[var(--foreground)]">Adicionar a tela inicial</strong>.
            </>
          )}
        </p>
      )}
      {isMobile && needsActivationReload && (
        <p className="mt-3 text-xs text-[var(--muted)] sm:text-sm">
          Na primeira visita, o navegador pode precisar ativar o aplicativo antes de liberar a
          instalacao. Toque no botao acima uma vez para preparar e recarregar a pagina.
        </p>
      )}
    </div>
  );
}
