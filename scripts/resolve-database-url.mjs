/**
 * Resolve a URL mysql://… a partir do .env (chame `import "dotenv/config"` antes).
 * MYSQL_HOST + MYSQL_USER + MYSQL_DATABASE têm prioridade sobre DATABASE_URL.
 */
import { normalizeMysqlHostForNode } from "./normalize-mysql-host.mjs";

function stripEnvValue(raw) {
  if (typeof raw !== "string") return undefined;
  let s = raw.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.length ? s : undefined;
}

export function resolveDatabaseUrlFromEnv() {
  const host = stripEnvValue(process.env.MYSQL_HOST);
  const user = stripEnvValue(process.env.MYSQL_USER);
  const database = stripEnvValue(process.env.MYSQL_DATABASE);
  if (host && user && database) {
    const tcpHost = normalizeMysqlHostForNode(host);
    const portRaw = stripEnvValue(process.env.MYSQL_PORT);
    const port = portRaw && /^\d+$/.test(portRaw) ? portRaw : "3306";
    const password =
      process.env.MYSQL_PASSWORD !== undefined
        ? stripEnvValue(process.env.MYSQL_PASSWORD) ?? ""
        : "";
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${tcpHost}:${port}/${encodeURIComponent(database)}`;
  }
  return stripEnvValue(process.env.DATABASE_URL);
}
