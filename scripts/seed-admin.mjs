import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
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
    database,
  };
}

async function main() {
  const url = resolveDatabaseUrlFromEnv();
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrador";

  if (!url || !email || !password) {
    console.error(
      "Defina DATABASE_URL (ou MYSQL_*), ADMIN_EMAIL e ADMIN_PASSWORD no .env"
    );
    process.exit(1);
  }

  const cfg = parseMysqlUrl(url);
  const conn = await mysql.createConnection(cfg);
  const passwordHash = await bcrypt.hash(password, 10);

  await conn.query(
    `INSERT INTO users (email, password_hash, name, cpf, phone, role)
     VALUES (?, ?, ?, NULL, NULL, 'ADMIN')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       name = VALUES(name),
       role = 'ADMIN'`,
    [email, passwordHash, name]
  );

  await conn.end();
  console.log(`Administrador garantido: ${email} (atualizado ou criado).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
