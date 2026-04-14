/**
 * Testa ligação MySQL (.env): DATABASE_URL ou MYSQL_HOST+MYSQL_USER+MYSQL_DATABASE(+MYSQL_PASSWORD).
 * Uso: npm.cmd run db:ping
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";

function parseMysqlUrl(connectionString) {
  const u = new URL(connectionString);
  const pathDb = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
  const database = decodeURIComponent(pathDb);
  return {
    host: u.hostname || "localhost",
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
    database: database || undefined,
  };
}

async function main() {
  const url = resolveDatabaseUrlFromEnv();
  if (!url) {
    console.error(
      "ERRO: defina DATABASE_URL ou MYSQL_HOST + MYSQL_USER + MYSQL_DATABASE no .env"
    );
    process.exit(1);
  }

  console.log("Tentando conectar ao MySQL...");
  let cfg;
  try {
    cfg = parseMysqlUrl(url);
  } catch (e) {
    console.error("ERRO: DATABASE_URL inválida (formato de URL).", e.message);
    process.exit(1);
  }

  console.log(`  host=${cfg.host} port=${cfg.port} user=${cfg.user} database=${cfg.database ?? "(não definido)"}`);

  try {
    const conn = await mysql.createConnection({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      connectTimeout: 8000,
    });
    await conn.ping();
    await conn.end();
    console.log("\nOK: MySQL respondeu. Conexão bem-sucedida.");
  } catch (e) {
    console.error("\nFALHA na conexão:");
    console.error(e.code || e.errno || "", e.message || e);
    console.error(`
Dicas no Windows:
  1) Serviços (services.msc): procure "MySQL" ou "MySQL80" e INICIE o serviço.
  2) PowerShell (como Administrador): net start MySQL80   (o nome pode variar)
  3) Se usa XAMPP/WAMP: inicie o MySQL pelo painel e confira a porta (às vezes 3306).
  4) Ajuste DATABASE_URL ou use MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE, MYSQL_PASSWORD
  5) Exemplo URL: mysql://root:SUA_SENHA@127.0.0.1:3306/sol_do_recreio
  6) Senha vazia: mysql://root:@127.0.0.1:3306/sol_do_recreio
`);
    process.exit(1);
  }
}

main();
