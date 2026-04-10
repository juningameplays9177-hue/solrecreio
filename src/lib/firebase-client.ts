"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function buildConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/** True quando dá para inicializar o app web (Auth). apiKey, authDomain e projectId vêm do Console; appId é recomendado mas opcional. */
export function isFirebaseClientConfigured(): boolean {
  const c = buildConfig();
  return Boolean(
    c.apiKey?.trim() &&
      c.authDomain?.trim() &&
      c.projectId?.trim()
  );
}

function getApp(): FirebaseApp {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase não configurado. Defina NEXT_PUBLIC_FIREBASE_* no .env ou .env.local e reinicie o servidor."
    );
  }
  const c = buildConfig();
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    apiKey: c.apiKey!,
    authDomain: c.authDomain!,
    projectId: c.projectId!,
    ...(c.storageBucket ? { storageBucket: c.storageBucket } : {}),
    ...(c.messagingSenderId ? { messagingSenderId: c.messagingSenderId } : {}),
    ...(c.appId?.trim() ? { appId: c.appId.trim() } : {}),
    ...(c.measurementId?.trim() ? { measurementId: c.measurementId.trim() } : {}),
  });
}

/** Abre o popup do Google e devolve o ID token para enviar ao backend. */
export async function signInWithGoogle(): Promise<string> {
  const auth = getAuth(getApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
