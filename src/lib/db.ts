import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2";
import { getNormalizedDatabaseUrl } from "@/lib/server-env";

/**
 * Limite por consulta (mysql2 `timeout` em QueryOptions) para não ficar pendurado
 * até o nginx devolver 504 Gateway Time-out.
 */
export const MYSQL_QUERY_TIMEOUT_MS = 14_000;

function safeDecodeURIComponent(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function parseMysqlUrl(connectionString: string): PoolOptions {
  const u = new URL(connectionString);
  const pathDb = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
  const database = safeDecodeURIComponent(pathDb).trim();
  const host = (u.hostname || "localhost").toLowerCase();

  const user = safeDecodeURIComponent(u.username).trim();
  const password = (u.password ? safeDecodeURIComponent(u.password) : "").trim();

  const base: PoolOptions = {
    host,
    port: u.port ? Number(u.port) : 3306,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    /** Evita fila infinita quando o pool está cheio (nginx 504 enquanto a requisição espera). */
    queueLimit: 40,
    /** Antes do proxy da hospedagem devolver 503/504, falhamos com erro JSON legível. */
    connectTimeout: 12_000,
    enableKeepAlive: true,
  };

  /**
   * TLS só quando pedido — forçar SSL em todos os hosts remotos pode travar o handshake
   * em servidores sem TLS e o proxy responde “503 temporarily busy”.
   * Use `DATABASE_SSL=1` ou `?ssl=true` no fim do DATABASE_URL.
   */
  const sslParam = u.searchParams.get("ssl")?.toLowerCase();
  const envSsl = (process.env.DATABASE_SSL ?? "").trim().toLowerCase();
  const useSsl =
    sslParam === "1" ||
    sslParam === "true" ||
    sslParam === "yes" ||
    envSsl === "1" ||
    envSsl === "true" ||
    envSsl === "yes";
  if (useSsl) {
    base.ssl = { rejectUnauthorized: false };
  }

  return base;
}

const g = globalThis as unknown as { mysqlPool?: mysql.Pool; mysqlPoolSourceUrl?: string };

export function getPool(): mysql.Pool {
  const url = getNormalizedDatabaseUrl();
  if (!url) {
    throw new Error("Defina DATABASE_URL ou MYSQL_HOST/MYSQL_USER/MYSQL_DATABASE no .env");
  }
  if (g.mysqlPool && g.mysqlPoolSourceUrl !== url) {
    void g.mysqlPool.end().catch(() => {});
    g.mysqlPool = undefined;
  }
  if (!g.mysqlPool) {
    g.mysqlPoolSourceUrl = url;
    g.mysqlPool = mysql.createPool(parseMysqlUrl(url));
  }
  return g.mysqlPool;
}
