"use client";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { scrubStaleGoogleConfigMessage } from "@/lib/scrub-stale-google-config-message";

/** Mesmo bloco da tela inicial: Continuar com Google + erro (scrub). Usar com `useGoogleAuthRedirect()` no pai. */
export function HomeGoogleAuthSection({
  googleLoading,
  googleError,
  runGoogleLogin,
  disabled = false,
  onBeforeGoogle,
  className = "",
}: {
  googleLoading: boolean;
  googleError: string | null;
  runGoogleLogin: () => void | Promise<void>;
  disabled?: boolean;
  onBeforeGoogle?: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <GoogleSignInButton
        loading={googleLoading}
        disabled={disabled}
        onPress={() => {
          onBeforeGoogle?.();
          void runGoogleLogin();
        }}
      />
      {googleError && (
        <p className="mt-3 text-sm text-[var(--error)]" role="alert">
          {scrubStaleGoogleConfigMessage(googleError)}
        </p>
      )}
    </div>
  );
}
