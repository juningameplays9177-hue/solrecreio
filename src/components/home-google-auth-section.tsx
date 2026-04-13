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
  buttonClassName = "",
  errorClassName = "",
}: {
  googleLoading: boolean;
  googleError: string | null;
  runGoogleLogin: () => void | Promise<void>;
  disabled?: boolean;
  onBeforeGoogle?: () => void;
  className?: string;
  /** Classes extra no botão (ex.: tema escuro no /login). */
  buttonClassName?: string;
  /** Classes do texto de erro (ex.: `text-red-300` em fundo escuro). */
  errorClassName?: string;
}) {
  return (
    <div className={className}>
      <GoogleSignInButton
        loading={googleLoading}
        disabled={disabled}
        className={buttonClassName}
        onPress={() => {
          onBeforeGoogle?.();
          void runGoogleLogin();
        }}
      />
      {googleError && (
        <p
          className={`mt-3 text-sm ${errorClassName || "text-[var(--error)]"}`}
          role="alert"
        >
          {scrubStaleGoogleConfigMessage(googleError)}
        </p>
      )}
    </div>
  );
}
