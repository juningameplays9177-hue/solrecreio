"use client";

import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
} from "firebase/auth";

import { getFirebaseWebConfigResolved } from "@/lib/firebase-web-config";
import { scrubStaleGoogleConfigMessage } from "@/lib/scrub-stale-google-config-message";

/** NEXT_PUBLIC_* (injetadas no build, ex. Hostinger) + fallback `firebase-web-public.ts`. */
function buildConfig(): FirebaseOptions {
  return getFirebaseWebConfigResolved();
}

export function isFirebaseClientConfigured(): boolean {
  const c = getFirebaseWebConfigResolved();
  return Boolean(c.apiKey && c.authDomain && c.projectId);
}

function getApp(): FirebaseApp {
  const c = buildConfig();
  const existing = getApps()[0];
  if (existing) return existing;
  try {
    return initializeApp(c);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/duplicate-app|already exists/i.test(msg)) {
      const again = getApps()[0];
      if (again) return again;
    }
    throw new Error(
      "Não foi possível inicializar o Firebase no navegador. Atualize a página ou tente mais tarde."
    );
  }
}

function firebaseAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object" || !("code" in err)) {
    return "Não foi possível iniciar o login do Google.";
  }
  const code = String((err as { code?: string }).code);
  const map: Record<string, string> = {
    "auth/unauthorized-domain":
      "Domínio não autorizado: no Firebase Console → Authentication → Settings → Authorized domains, adicione este endereço (ex.: localhost, 127.0.0.1, teu-dominio.com).",
    "auth/invalid-api-key":
      "Chave da API Firebase inválida. Confira NEXT_PUBLIC_FIREBASE_API_KEY no painel / .env e faça novo build; ou atualize `src/lib/firebase-web-public.ts`.",
    "auth/configuration-not-found":
      "Projeto Firebase não encontrado para esta chave. Verifique NEXT_PUBLIC_FIREBASE_* (novo build após alterar) ou `firebase-web-public.ts`.",
    "auth/popup-blocked":
      "O navegador bloqueou o login. Tente de novo ou use outro browser.",
    "auth/popup-closed-by-user":
      "O login foi cancelado. Tente Continuar com Google de novo.",
    "auth/cancelled-popup-request": "Só um login de cada vez. Tente de novo.",
  };
  const mapped = map[code];
  if (mapped) return mapped;
  if (err instanceof Error && err.message) {
    if (/popup-closed-by-user/i.test(err.message)) return map["auth/popup-closed-by-user"]!;
    return scrubStaleGoogleConfigMessage(err.message);
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return scrubStaleGoogleConfigMessage(msg);
  }
  return "Erro no login com Google.";
}

/**
 * Redireciona para a página de login Google (evita popup e erros COOP / window.closed).
 * Após o utilizador voltar, `consumeGoogleRedirectIdToken()` obtém o token.
 */
export async function startGoogleSignInRedirect(): Promise<void> {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase não está configurado para este site. Confira as variáveis NEXT_PUBLIC_FIREBASE_* no build."
    );
  }
  try {
    const auth = getAuth(getApp());
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithRedirect(auth, provider);
  } catch (e) {
    throw new Error(firebaseAuthErrorMessage(e));
  }
}

/** Chame após o retorno do redirect; devolve null se não houver resultado pendente. */
export async function consumeGoogleRedirectIdToken(): Promise<string | null> {
  if (!isFirebaseClientConfigured()) {
    return null;
  }
  try {
    const auth = getAuth(getApp());
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    return await result.user.getIdToken();
  } catch (e) {
    // Não rebentar a app inteira (ex.: domínio não autorizado, sessão inválida, IndexedDB).
    console.warn("[firebase] getRedirectResult:", e);
    return null;
  }
}
