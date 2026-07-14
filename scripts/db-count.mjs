import "dotenv/config";
import mysql from "mysql2/promise";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";
import { normalizeMysqlHostForNode } from "./normalize-mysql-host.mjs";

const url = resolveDatabaseUrlFromEnv();
const u = new URL(url);
const conn = await mysql.createConnection({
  host: normalizeMysqlHostForNode(u.hostname),
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.slice(1)),
});
const [tables] = await conn.query("SHOW TABLES");
console.log("Tabelas:", tables.map((t) => Object.values(t)[0]).join(", "));
for (const t of [
  "sr_User",
  "sr_Purchase",
  "sr_CashbackRedemption",
  "users",
  "cashback_invoices",
]) {
  try {
    const [r] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    console.log(`${t}: ${r[0].c}`);
  } catch {
    console.log(`${t}: (nao existe)`);
  }
}
await conn.end();
