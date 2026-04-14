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
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1";

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
    connectTimeout: 20_000,
    enableKeepAlive: true,
  };

  /** MySQL remoto (ex.: Hostinger com TLS) — sem isto às vezes falha ou devolve acesso negado enganoso. */
  if (!isLocal) {
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
