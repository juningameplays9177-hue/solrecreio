import fs from "fs";
import path from "path";
import admin from "firebase-admin";

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

  // 1) JSON em uma linha no .env
  if (jsonInline) {
    const serviceAccount = JSON.parse(jsonInline) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  // 2) Caminho para o .json (como no snippet: require("path/to/serviceAccountKey.json"))
  if (jsonPath) {
    const serviceAccount = readServiceAccountFromFile(jsonPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  // 3) Variável padrão do Google Cloud: aponta para o arquivo .json
  if (googleAppCreds) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return;
  }

  throw new Error(
    "Credenciais Firebase Admin ausentes. Defina FIREBASE_SERVICE_ACCOUNT_JSON, ou FIREBASE_SERVICE_ACCOUNT_PATH, ou GOOGLE_APPLICATION_CREDENTIALS no .env."
  );
}

export async function verifyFirebaseIdToken(idToken: string) {
  ensureAdminApp();
  return admin.auth().verifyIdToken(idToken);
}

/** True se alguma forma de credencial Admin estiver configurada (sem validar o arquivo). */
export function hasFirebaseAdminEnv(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}
