"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consumeGoogleRedirectIdToken } from "@/lib/firebase-client";
import { exchangeGoogleIdToken } from "@/lib/google-auth-exchange";

/**
 * Completa o login Google após `signInWithRedirect` (sem popup — compatível com COOP).
 */
export function GoogleRedirectResultHandler() {
  const router = useRouter();
  const ran = useRef(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    let cancelled = false;

    void (async () => {
      try {
        const idToken = await consumeGoogleRedirectIdToken();
        if (cancelled || !idToken) return;
        ran.current = true;
        const out = await exchangeGoogleIdToken(idToken);
        if (cancelled) return;
        if (!out.ok) {
          setBanner(out.error);
          return;
        }
        if (out.role === "ADMIN") router.push("/admin");
        else if (out.profileComplete === false) router.push("/completar-cadastro");
        else router.push("/painel");
        router.refresh();
      } catch (e) {
        if (cancelled) return;
        ran.current = true;
        setBanner(e instanceof Error ? e.message : "Falha ao entrar com Google.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!banner) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] border-b border-[var(--error)] bg-red-50 px-4 py-3 text-center text-sm text-red-900 shadow-sm"
      role="alert"
    >
      {banner}
    </div>
  );
}
