"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { isFirebaseClientConfigured, signInWithGoogle } from "@/lib/firebase-client";

export function useGoogleAuthRedirect() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const runGoogleLogin = useCallback(async () => {
    setGoogleError(null);
    if (!isFirebaseClientConfigured()) {
      setGoogleError(
        "Login com Google não está configurado. No arquivo .env, defina NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN e NEXT_PUBLIC_FIREBASE_PROJECT_ID (copie do Firebase Console → Configurações do projeto → Seus apps). Opcional: NEXT_PUBLIC_FIREBASE_APP_ID. Reinicie o servidor após salvar."
      );
      return;
    }
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGoogleError(
          typeof data.error === "string" ? data.error : "Falha ao entrar com Google"
        );
        return;
      }
      if (data.role === "ADMIN") router.push("/admin");
      else if (data.profileComplete === false) router.push("/completar-cadastro");
      else router.push("/painel");
      router.refresh();
    } catch (err) {
      setGoogleError(
        err instanceof Error ? err.message : "Não foi possível abrir o login do Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [router]);

  return { runGoogleLogin, googleLoading, googleError, setGoogleError };
}
