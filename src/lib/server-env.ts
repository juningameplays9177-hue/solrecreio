import fs from "fs";
import path from "path";

function resolveCredentialPath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

/**
 * mysql://user:password@host — o separador real é o **último** @ antes do host.
 * Se a senha contiver @, o URL cru fica com vários @; aqui recompomos e codificamos
 * utilizador e senha (ex.: @ na senha → %40).
 */
function repairMysqlDatabaseUrlAmbiguousAt(dbUrl: string): string {
  if (!/^mysql:\/\//i.test(dbUrl)) return dbUrl;
  const rest = dbUrl.slice("mysql://".length);
  if (!rest.includes("@") || rest.split("@").length <= 2) return dbUrl;

  const sep = rest.lastIndexOf("@");
  if (sep <= 0) return dbUrl;
  const creds = rest.slice(0, sep);
  const hostDb = rest.slice(sep + 1);
  const colon = creds.indexOf(":");
  if (colon === -1) return dbUrl;
  const userRaw = creds.slice(0, colon);
  const passRaw = creds.slice(colon + 1);
  if (!userRaw) return dbUrl;

  const decodeSafely = (v: string) => {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const user = decodeSafely(userRaw);
  const password = decodeSafely(passRaw);
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${hostDb}`;
}

/** Valor de DATABASE_URL sem espaços e sem aspas extras (comuns no painel da Hostinger). */
export function getNormalizedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (typeof raw !== "string") return undefined;
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (!s.length) return undefined;
  return repairMysqlDatabaseUrlAmbiguousAt(s);
}

/** Erros de configuração da DATABASE_URL antes de abrir o pool MySQL. */
export function collectDatabaseUrlEnvErrors(): string[] {
  const dbUrl = getNormalizedDatabaseUrl();
  if (!dbUrl) {
    return [
      "Configure DATABASE_URL (variáveis de ambiente no painel da hospedagem ou .env local). Reinicie o Node após salvar. Veja .env.example.",
    ];
  }
  try {
    const parsed = new URL(dbUrl);
    if (!parsed.hostname) {
      return ["DATABASE_URL sem hostname. Confira mysql://utilizador:senha@host:3306/banco."];
    }
  } catch {
    return [
      "DATABASE_URL tem formato inválido. Remova aspas envolvendo o URL no painel e confira mysql://utilizador:senha@host:3306/banco.",
    ];
  }
  return [];
}

/** HTTP status para falhas MySQL em rotas de auth (evita 500 genérico quando o serviço é configuração/rede). */
export function mysqlAuthRouteCatchStatus(e: unknown): number {
  const code = errCode(e);
  const errno = errNo(e);
  if (code === "ER_DUP_ENTRY" || errno === 1062) return 409;
  /** 502 distingue falha MySQL de 503 genérico de proxies/CDN (“temporarily busy”). */
  if (mysqlFriendlyMessage(e)) return 502;
  return 500;
}

export function getServerEnvErrors(): string[] {
  const errors: string[] = [];
  errors.push(...collectDatabaseUrlEnvErrors());
  const auth = process.env.AUTH_SECRET?.trim();
  if (!auth || auth.length < 16) {
    errors.push(
      "Configure AUTH_SECRET no .env com pelo menos 16 caracteres."
    );
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
        "Sessão inválida. Atualize a página e tente Continuar com Google de novo.",
    };
    if (byCode[code]) return byCode[code]!;
  }

  const msg = extractNestedErrorMessage(e);
  if (!msg) return undefined;

  if (/expired|JWTExpired|jwt expired/i.test(msg)) {
    return "O login do Google expirou. Tente Continuar com Google de novo.";
  }
  if (
    /audience|issuer|signature|JWTClaim|JWSSignature|claim|nbf|iat/i.test(msg)
  ) {
    return "O projeto Firebase do servidor não bate com o da app (token). Confira as credenciais do mesmo projeto no .env ou comente GOOGLE_APPLICATION_CREDENTIALS para validar só com JWKS.";
  }
  if (/ECONNRESET|fetch failed|getaddrinfo|ENOTFOUND|network|Failed to fetch/i.test(msg)) {
    return "Falha de rede ao validar o login com Google. Verifique a internet ou firewall.";
  }
  if (/Decoding Firebase ID token|verifyIdToken|invalid token/i.test(msg)) {
    return "Não foi possível validar o token do Google. Tente entrar de novo.";
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
  if (code === "PROTOCOL_SEQUENCE_TIMEOUT") {
    return "A consulta ao MySQL demorou demais. Verifique DATABASE_URL/rede ou tente de novo.";
  }
  const nested = extractNestedErrorMessage(e);
  if (/Queue limit reached|No connections available/i.test(nested)) {
    return "Muitas consultas ao MySQL ao mesmo tempo. Aguarde um instante e tente de novo.";
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

/** Mantido para scripts ou ferramentas que validam credenciais Firebase no deploy. */
export function getFirebaseAuthServerEnvErrors(): string[] {
  const errors: string[] = [];
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (jsonPath && !fs.existsSync(resolveCredentialPath(jsonPath))) {
    errors.push(
      `Ficheiro Admin não encontrado: ${resolveCredentialPath(jsonPath)}. Remova FIREBASE_SERVICE_ACCOUNT_PATH do .env para usar só JWKS, ou coloque o ficheiro correto.`
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
