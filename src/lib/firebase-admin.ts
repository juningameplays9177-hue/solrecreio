import fs from "fs";
import path from "path";
import admin from "firebase-admin";

import { getFirebaseProjectIdResolved } from "@/lib/firebase-web-config";
import { verifyFirebaseIdTokenWithJwks } from "@/lib/verify-firebase-id-token-jwks";

function readServiceAccountFromFile(filePath: string): admin.ServiceAccount {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Arquivo de conta de serviço não encontrado: ${resolved} (FIREBASE_SERVICE_ACCOUNT_PATH ou GOOGLE_APPLICATION_CREDENTIALS)`
    );
  }
  const raw = fs.readFileSync(resolved, "utf8");
  return JSON.parse(raw) as admin.ServiceAccount;
}

function ensureAdminApp() {
  if (admin.apps.length > 0) return;

  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  const projectId = getFirebaseProjectIdResolved();

  if (jsonInline) {
    const serviceAccount = JSON.parse(jsonInline) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId || projectId,
    });
    return;
  }

  if (jsonPath) {
    const serviceAccount = readServiceAccountFromFile(jsonPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId || projectId,
    });
    return;
  }

  if (googleAppCreds) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    return;
  }

  throw new Error(
    "Credenciais Firebase Admin ausentes. Defina FIREBASE_SERVICE_ACCOUNT_JSON, ou FIREBASE_SERVICE_ACCOUNT_PATH, ou GOOGLE_APPLICATION_CREDENTIALS no .env."
  );
}

/**
 * Verifica o ID token do utilizador Firebase.
 * Por defeito usa JWKS públicos (não precisa de serviceAccountKey.json).
 * Se existir credencial Admin no .env, usa o SDK oficial (opcional).
 */
export async function verifyFirebaseIdToken(idToken: string) {
  const useAdmin =
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());

  if (useAdmin) {
    ensureAdminApp();
    return admin.auth().verifyIdToken(idToken);
  }

  return verifyFirebaseIdTokenWithJwks(idToken);
}

/** True se credencial Admin explícita estiver definida (opcional). */
export function hasFirebaseAdminEnv(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}
