import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2";
import { getNormalizedDatabaseUrl } from "@/lib/server-env";

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
  const password = u.password ? safeDecodeURIComponent(u.password) : "";

  const base: PoolOptions = {
    host,
    port: u.port ? Number(u.port) : 3306,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    /** Antes do proxy da hospedagem devolver 503 por timeout, falhamos com erro JSON legível. */
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

function getPoolConfig(): PoolOptions {
  const url = getNormalizedDatabaseUrl();
  if (!url) {
    throw new Error("Defina DATABASE_URL no arquivo .env");
  }
  return parseMysqlUrl(url);
}

const g = globalThis as unknown as { mysqlPool?: mysql.Pool };

export function getPool(): mysql.Pool {
  if (!g.mysqlPool) {
    g.mysqlPool = mysql.createPool(getPoolConfig());
  }
  return g.mysqlPool;
}
