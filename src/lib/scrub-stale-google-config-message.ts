const REPLACEMENT =
  "O site ainda está a servir uma versão antiga do código ou cache. No servidor: apague a pasta .next, corra npm run build e reinicie. No browser: Ctrl+Shift+R. O Firebase está em src/lib/firebase-web-public.ts e nas variáveis NEXT_PUBLIC_* (o build tem de correr depois de as definir no painel).";

/**
 * Mensagem legada removida do repositório; ainda pode aparecer por cache/CDN ou deploy antigo.
 */
export function scrubStaleGoogleConfigMessage(message: string): string {
  if (!message) return message;
  const n = message.normalize("NFC");
  const lower = n.toLowerCase();

  const hasFirebaseEnvInstructions =
    lower.includes("next_public_firebase") ||
    (lower.includes("defina") &&
      lower.includes("firebase") &&
      (lower.includes(".env") || lower.includes("env.local")));

  const hasLegacyLoginWording =
    lower.includes("login com google") && lower.includes("configurado");

  if (hasLegacyLoginWording || (hasFirebaseEnvInstructions && lower.includes("copie do firebase"))) {
    return REPLACEMENT;
  }

  return message;
}

/** Extrai string de erro de respostas JSON heterogéneas. */
export function apiErrorString(data: unknown): string {
  if (!data || typeof data !== "object") return "Falha ao entrar com Google";
  const d = data as Record<string, unknown>;
  const e = d.error;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Falha ao entrar com Google";
}
