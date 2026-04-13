import { createRemoteJWKSet, jwtVerify } from "jose";

import { getFirebaseProjectIdResolved } from "@/lib/firebase-web-config";

/** JWKS oficiais do Firebase Auth (mesma verificação que o Admin SDK usa para ID tokens). */
const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

function projectId(): string {
  return getFirebaseProjectIdResolved();
}

/** Formato compatível com o que /api/auth/google espera de verifyIdToken. */
export type VerifiedFirebaseIdToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

/**
 * Valida o ID token do Firebase Auth sem conta de serviço (só projectId + chaves públicas Google).
 * @see https://firebase.google.com/docs/auth/admin/verify-id-tokens
 */
export async function verifyFirebaseIdTokenWithJwks(
  idToken: string
): Promise<VerifiedFirebaseIdToken> {
  const pid = projectId();
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${pid}`,
    audience: pid,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) {
    throw new Error("Token inválido (sem subject).");
  }

  const emailVerifiedRaw = payload.email_verified;
  const emailVerified =
    emailVerifiedRaw === true ||
    emailVerifiedRaw === "true" ||
    emailVerifiedRaw === 1;

  return {
    uid: sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    email_verified: emailVerified,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}
