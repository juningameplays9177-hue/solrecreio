import fs from "fs";
import path from "path";

function resolveCredentialPath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

export function getServerEnvErrors(): string[] {
  const errors: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) {
    errors.push(
      "Configure DATABASE_URL no arquivo .env na raiz do projeto (veja .env.example). Reinicie o servidor após salvar. Em deploy (ex.: Vercel), defina DATABASE_URL nas variáveis de ambiente."
    );
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    errors.push(
      "Configure AUTH_SECRET no .env com pelo menos 16 caracteres."
    );
  }
  return errors;
}

/**
 * Erros opcionais para credenciais Admin (só se definir PATH/JSON — login Google * funciona sem isso, via JWKS em verify-firebase-id-token-jwks.ts).
 */
export function getFirebaseAuthServerEnvErrors(): string[] {
  const errors: string[] = [];
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (jsonPath && !fs.existsSync(resolveCredentialPath(jsonPath))) {
    errors.push(
      `Ficheiro Admin não encontrado: ${resolveCredentialPath(jsonPath)}. Remova FIREBASE_SERVICE_ACCOUNT_PATH do .env para usar só verificação JWT (sem JSON), ou coloque o ficheiro correto.`
    );
  }
  if (googleCreds && !fs.existsSync(resolveCredentialPath(googleCreds))) {
    errors.push(
      `GOOGLE_APPLICATION_CREDENTIALS aponta para ficheiro inexistente: ${resolveCredentialPath(googleCreds)}.`
    );
  }
  if (jsonInline) {
    try {
      JSON.parse(jsonInline);
    } catch {
      errors.push(
        "FIREBASE_SERVICE_ACCOUNT_JSON não é JSON válido. Gere com: npm run firebase:service-account-line -- \"caminho\\\\chave.json\""
      );
    }
  }

  return errors;
}

function errCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code?: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

function errNo(e: unknown): number | undefined {
  if (e && typeof e === "object" && "errno" in e) {
    const n = (e as { errno?: unknown }).errno;
    return typeof n === "number" ? n : undefined;
  }
  return undefined;
}

function sqlMessage(e: unknown): string | undefined {
  if (e && typeof e === "object" && "sqlMessage" in e) {
    const s = (e as { sqlMessage?: unknown }).sqlMessage;
    return typeof s === "string" ? s : undefined;
  }
  return undefined;
}

function extractNestedErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    const parts = [e.message];
    const c = e.cause;
    if (c instanceof Error && c.message) parts.push(c.message);
    return parts.join(" ");
  }
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === "string" ? m : "";
  }
  return "";
}

/**
 * Erros ao verificar o ID token Firebase (Admin SDK ou JWKS / jose) — útil em produção
 * onde o fallback genérico não explica a causa.
 */
function firebaseAuthErrorCode(e: unknown): string | undefined {
  const top = errCode(e);
  if (top) return top;
  if (e && typeof e === "object" && "errorInfo" in e) {
    const ei = (e as { errorInfo?: { code?: unknown } }).errorInfo;
    const c = ei?.code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

function googleAuthVerifyFriendlyMessage(e: unknown): string | undefined {
  const code = firebaseAuthErrorCode(e);
  if (code) {
    const byCode: Record<string, string> = {
      "auth/id-token-expired":
        "O login do Google expirou. Clique de novo em Continuar com Google.",
      "auth/invalid-id-token":
        "Token inválido. Atualize a página e tente Continuar com Google de novo.",
      "auth/argument-error":
        "Sessão inválida. Feche o popup do Google, atualize a página e tente outra vez.",
    };
    if (byCode[code]) return byCode[code];
  }

  const msg = extractNestedErrorMessage(e);
  if (!msg) return undefined;

  if (/expired|JWTExpired|jwt expired/i.test(msg)) {
    return "O login do Google expirou. Tente Continuar com Google de novo.";
  }
  if (
    /audience|issuer|signature|JWTClaim|JWSSignature|claim|nbf|iat/i.test(msg)
  ) {
    return "O projeto Firebase do servidor não bate com o da app (token). Confira GOOGLE_APPLICATION_CREDENTIALS / chave de serviço do MESMO projeto que firebase-web-public.ts, ou comente GOOGLE_APPLICATION_CREDENTIALS no .env para validar só com JWKS.";
  }
  if (/ECONNRESET|fetch failed|getaddrinfo|ENOTFOUND|network|Failed to fetch/i.test(msg)) {
    return "Falha de rede ao validar o login com Google. Verifique a internet ou firewall.";
  }
  if (/Decoding Firebase ID token|verifyIdToken|invalid token/i.test(msg)) {
    return "Não foi possível validar o token do Google. Tente entrar de novo ou confira as credenciais Admin no .env.";
  }
  return undefined;
}

/** Mensagem amigável para erros comuns do mysql2 */
export function mysqlFriendlyMessage(e: unknown): string | undefined {
  const code = errCode(e);
  const errno = errNo(e);

  if (code === "ECONNREFUSED" || errno === -111) {
    return "Não foi possível conectar ao MySQL. Ligue o MySQL (serviço no Windows) e confira DATABASE_URL no .env.";
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ER_NOT_SUPPORTED_AUTH_MODE") {
    return "Acesso negado ao MySQL. Confira usuário e senha em DATABASE_URL no .env.";
  }
  if (code === "ER_BAD_DB_ERROR") {
    return "Banco de dados inexistente. Rode no terminal: npm.cmd run db:init";
  }
  if (code === "ER_NO_SUCH_TABLE" || errno === 1146) {
    return "Tabela ausente. Rode no terminal: npm.cmd run db:init";
  }
  if (code === "ER_DUP_ENTRY" || errno === 1062) {
    return "E-mail ou CPF já cadastrado (registro duplicado).";
  }
  if (code === "PROTOCOL_CONNECTION_LOST" || code === "ECONNRESET") {
    return "Conexão com o MySQL caiu. Tente de novo e verifique se o servidor MySQL está estável.";
  }
  return undefined;
}

export function apiErrorMessage(e: unknown, fallback: string): string {
  const mysqlMsg = mysqlFriendlyMessage(e);
  if (mysqlMsg) return mysqlMsg;
  const googleMsg = googleAuthVerifyFriendlyMessage(e);
  if (googleMsg) return googleMsg;
  const sql = sqlMessage(e);
  if (sql && sql.length < 500) {
    return sql;
  }
  if (e instanceof Error && e.message) {
    const line = e.message.split("\n")[0]?.trim() ?? "";
    if (line.length > 0 && line.length < 400 && !/^\s*at\s/.test(line)) {
      return line;
    }
  }
  return fallback;
}
