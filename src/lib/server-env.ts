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

/** Erros de ambiente só para rotas que usam Firebase Admin (ex.: login com Google). */
export function getFirebaseAuthServerEnvErrors(): string[] {
  const errors: string[] = [];
  const has =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!has) {
    errors.push(
      "Configure credenciais Firebase Admin no .env: FIREBASE_SERVICE_ACCOUNT_JSON (JSON numa linha), ou FIREBASE_SERVICE_ACCOUNT_PATH (caminho para o .json), ou GOOGLE_APPLICATION_CREDENTIALS (caminho para o .json, padrão Google Cloud)."
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
  const sql = sqlMessage(e);
  if (sql && process.env.NODE_ENV === "development") {
    return sql;
  }
  if (process.env.NODE_ENV === "development" && e instanceof Error && e.message) {
    return e.message;
  }
  return fallback;
}
