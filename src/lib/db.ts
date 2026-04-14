import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2";
import { getNormalizedDatabaseUrl } from "@/lib/server-env";

function parseMysqlUrl(connectionString: string): PoolOptions {
  const u = new URL(connectionString);
  const pathDb = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
  const database = decodeURIComponent(pathDb);
  return {
    host: u.hostname || "localhost",
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
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
