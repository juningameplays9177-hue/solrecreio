import type { FirebaseOptions } from "firebase/app";

import { FIREBASE_WEB_PUBLIC } from "@/lib/firebase-web-public";

function pick(env: string | undefined, fallback: string): string {
  const t = env?.trim();
  return t || fallback;
}

/**
 * Mesma resolução no cliente (build) e no servidor: NEXT_PUBLIC_* do painel (ex.: Hostinger)
 * com fallback para `firebase-web-public.ts` (repo).
 */
export function getFirebaseWebConfigResolved(): FirebaseOptions {
  const measurementId = pick(
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    FIREBASE_WEB_PUBLIC.measurementId
  );
  return {
    apiKey: pick(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, FIREBASE_WEB_PUBLIC.apiKey),
    authDomain: pick(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_WEB_PUBLIC.authDomain
    ),
    projectId: pick(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_WEB_PUBLIC.projectId),
    storageBucket: pick(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_WEB_PUBLIC.storageBucket
    ),
    messagingSenderId: pick(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_WEB_PUBLIC.messagingSenderId
    ),
    appId: pick(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, FIREBASE_WEB_PUBLIC.appId),
    ...(measurementId ? { measurementId } : {}),
  };
}

export function getFirebaseProjectIdResolved(): string {
  return getFirebaseWebConfigResolved().projectId as string;
}
