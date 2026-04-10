"use client";

import { useCallback, useState } from "react";
import { startGoogleSignInRedirect } from "@/lib/firebase-client";
import { scrubStaleGoogleConfigMessage } from "@/lib/scrub-stale-google-config-message";

export function useGoogleAuthRedirect() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const runGoogleLogin = useCallback(async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      await startGoogleSignInRedirect();
      // A página redireciona para o Google; o retorno é tratado em GoogleRedirectResultHandler.
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Não foi possível iniciar o login do Google.";
      setGoogleError(scrubStaleGoogleConfigMessage(msg));
      setGoogleLoading(false);
    }
  }, []);

  return { runGoogleLogin, googleLoading, googleError, setGoogleError };
}
