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

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setShowManualHint(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function install() {
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

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Instalar aplicativo</p>
          <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
            Adicione o Sol do Recreio na tela inicial para abrir como app.
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={loading}
          className="touch-target inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-60"
        >
          {loading ? "Abrindo..." : "Instalar app"}
        </button>
      </div>
      {showManualHint && (
        <p className="mt-3 text-xs text-[var(--muted)] sm:text-sm">
          Se o navegador nao mostrar a instalacao automaticamente, use o menu do navegador e escolha
          <strong className="text-[var(--foreground)]"> Instalar app</strong> ou{" "}
          <strong className="text-[var(--foreground)]">Adicionar a tela inicial</strong>.
        </p>
      )}
    </div>
  );
}
