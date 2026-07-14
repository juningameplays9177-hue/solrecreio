import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { execSync } from "node:child_process";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";
import { normalizeMysqlHostForNode } from "./normalize-mysql-host.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SR_MIGRATION_SQL = path.join(
  __dirname,
  "../prisma/migrations/20260714120000_init_sr_schema/migration.sql",
);

const LEGACY_USER_TABLE = "users";
const LEGACY_PURCHASE_TABLE = "cashback_invoices";
const LEGACY_REDEMPTION_TABLE = "cashback_redemptions";
const LEGACY_APP_SETTING_TABLE = "app_settings";
const LEGACY_NOTIFICATION_TABLE = "notifications";
const LEGACY_PWD_RESET_TABLE = "password_reset_tokens";
const LEGACY_LEDGER_TABLE = "cashback_ledger";

const TARGET = {
  user: "sr_User",
  purchase: "sr_Purchase",
  cashbackRedemption: "sr_CashbackRedemption",
  appSetting: "sr_AppSetting",
  notification: "sr_Notification",
  passwordResetToken: "sr_PasswordResetToken",
  cashbackLedger: "sr_CashbackLedger",
};

function parseUrl(url) {
  const u = new URL(url);
  return {
    host: normalizeMysqlHostForNode(u.hostname || "localhost"),
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: u.password ? decodeURIComponent(u.password) : "",
    database: decodeURIComponent(u.pathname.replace(/^\//, "").split("/")[0] ?? ""),
  };
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function countRows(conn, table) {
  if (!(await tableExists(conn, table))) return 0;
  const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c ?? 0);
}

async function migrateUsersFromLegacy(conn) {
  if (!(await tableExists(conn, LEGACY_USER_TABLE))) {
    console.log(`— ${LEGACY_USER_TABLE} não existe; ignorando.`);
    return 0;
  }
  const before = await countRows(conn, TARGET.user);
  await conn.query(`
    INSERT INTO \`${TARGET.user}\`
      (id, email, password_hash, name, cpf, phone, role, cashback_balance, created_at)
    SELECT id, email, password_hash, name, cpf, phone, role, cashback_balance, created_at
    FROM \`${LEGACY_USER_TABLE}\`
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      name = VALUES(name),
      cpf = VALUES(cpf),
      phone = VALUES(phone),
      role = VALUES(role),
      cashback_balance = VALUES(cashback_balance)
  `);
  const after = await countRows(conn, TARGET.user);
  console.log(`✓ users → ${TARGET.user}: ${after - before} novos (${after} total)`);
  return after - before;
}

async function migratePurchasesFromLegacy(conn) {
  if (!(await tableExists(conn, LEGACY_PURCHASE_TABLE))) {
    console.log(`— ${LEGACY_PURCHASE_TABLE} não existe; ignorando.`);
    return 0;
  }
  const before = await countRows(conn, TARGET.purchase);
  await conn.query(`
    INSERT INTO \`${TARGET.purchase}\`
      (id, user_id, amount, credited_amount, status, file_path, original_filename, admin_note, created_at, reviewed_at)
    SELECT id, user_id, amount, credited_amount, status, file_path, original_filename, admin_note, created_at, reviewed_at
    FROM \`${LEGACY_PURCHASE_TABLE}\`
    ON DUPLICATE KEY UPDATE
      amount = VALUES(amount),
      credited_amount = VALUES(credited_amount),
      status = VALUES(status),
      file_path = VALUES(file_path),
      original_filename = VALUES(original_filename),
      admin_note = VALUES(admin_note),
      reviewed_at = VALUES(reviewed_at)
  `);
  const after = await countRows(conn, TARGET.purchase);
  console.log(`✓ compras (${LEGACY_PURCHASE_TABLE}) → ${TARGET.purchase}: ${after - before} novos (${after} total)`);
  return after - before;
}

async function migrateRedemptionsFromLegacy(conn) {
  if (!(await tableExists(conn, LEGACY_REDEMPTION_TABLE))) {
    console.log(`— ${LEGACY_REDEMPTION_TABLE} não existe; ignorando.`);
    return 0;
  }
  const before = await countRows(conn, TARGET.cashbackRedemption);
  await conn.query(`
    INSERT INTO \`${TARGET.cashbackRedemption}\`
      (id, user_id, amount, status, coupon_code, admin_note, created_at, reviewed_at, approved_at, rejected_at)
    SELECT id, user_id, amount, status, coupon_code, admin_note, created_at, reviewed_at, approved_at, rejected_at
    FROM \`${LEGACY_REDEMPTION_TABLE}\`
    ON DUPLICATE KEY UPDATE
      amount = VALUES(amount),
      status = VALUES(status),
      coupon_code = VALUES(coupon_code),
      admin_note = VALUES(admin_note),
      reviewed_at = VALUES(reviewed_at),
      approved_at = VALUES(approved_at),
      rejected_at = VALUES(rejected_at)
  `);
  const after = await countRows(conn, TARGET.cashbackRedemption);
  console.log(`✓ resgates (${LEGACY_REDEMPTION_TABLE}) → ${TARGET.cashbackRedemption}: ${after - before} novos (${after} total)`);
  return after - before;
}

async function migrateGenericById(conn, sourceTable, targetTable, columns) {
  if (!(await tableExists(conn, sourceTable))) {
    console.log(`— ${sourceTable} não existe; ignorando.`);
    return;
  }
  const cols = columns.join(", ");
  const before = await countRows(conn, targetTable);
  await conn.query(`
    INSERT INTO \`${targetTable}\` (${cols})
    SELECT ${cols} FROM \`${sourceTable}\`
    ON DUPLICATE KEY UPDATE ${columns
      .filter((c) => c !== "id")
      .map((c) => `${c} = VALUES(${c})`)
      .join(", ")}
  `);
  const after = await countRows(conn, targetTable);
  console.log(`✓ ${sourceTable} → ${targetTable}: ${after - before} novos (${after} total)`);
}

async function mergeFromHoryzonn(targetConn, horyzonnUrl) {
  if (!horyzonnUrl) {
    console.log("\n— HORYZONN_DATABASE_URL não definido; ignorando merge do u494944867_horyzonn.");
    return;
  }

  const hz = parseUrl(horyzonnUrl);
  const hzConn = await mysql.createConnection(hz);
  console.log(`\nMerge a partir de ${hz.database} (horyzonn)...`);

  try {
    if (await tableExists(hzConn, TARGET.user)) {
      const before = await countRows(targetConn, TARGET.user);
      await targetConn.query(`
        INSERT INTO \`${TARGET.user}\`
          (id, email, password_hash, name, cpf, phone, role, cashback_balance, created_at)
        SELECT id, email, password_hash, name, cpf, phone, role, cashback_balance, created_at
        FROM \`${hz.database}\`.\`${TARGET.user}\`
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash),
          name = VALUES(name),
          cpf = VALUES(cpf),
          phone = VALUES(phone),
          role = VALUES(role),
          cashback_balance = GREATEST(\`${TARGET.user}\`.cashback_balance, VALUES(cashback_balance))
      `);
      const after = await countRows(targetConn, TARGET.user);
      console.log(`✓ horyzonn.${TARGET.user} → ${TARGET.user}: +${after - before} (${after} total)`);
    }

    if (await tableExists(hzConn, TARGET.purchase)) {
      const before = await countRows(targetConn, TARGET.purchase);
      await targetConn.query(`
        INSERT INTO \`${TARGET.purchase}\`
          (id, user_id, amount, credited_amount, status, file_path, original_filename, admin_note, created_at, reviewed_at)
        SELECT id, user_id, amount, credited_amount, status, file_path, original_filename, admin_note, created_at, reviewed_at
        FROM \`${hz.database}\`.\`${TARGET.purchase}\`
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          credited_amount = VALUES(credited_amount),
          status = VALUES(status),
          file_path = VALUES(file_path),
          original_filename = VALUES(original_filename),
          admin_note = VALUES(admin_note),
          reviewed_at = VALUES(reviewed_at)
      `);
      const after = await countRows(targetConn, TARGET.purchase);
      console.log(`✓ horyzonn.${TARGET.purchase} → ${TARGET.purchase}: +${after - before} (${after} total)`);
    }

    if (await tableExists(hzConn, TARGET.cashbackRedemption)) {
      const before = await countRows(targetConn, TARGET.cashbackRedemption);
      await targetConn.query(`
        INSERT INTO \`${TARGET.cashbackRedemption}\`
          (id, user_id, amount, status, coupon_code, admin_note, created_at, reviewed_at, approved_at, rejected_at)
        SELECT id, user_id, amount, status, coupon_code, admin_note, created_at, reviewed_at, approved_at, rejected_at
        FROM \`${hz.database}\`.\`${TARGET.cashbackRedemption}\`
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          status = VALUES(status),
          coupon_code = VALUES(coupon_code),
          admin_note = VALUES(admin_note),
          reviewed_at = VALUES(reviewed_at),
          approved_at = VALUES(approved_at),
          rejected_at = VALUES(rejected_at)
      `);
      const after = await countRows(targetConn, TARGET.cashbackRedemption);
      console.log(`✓ horyzonn.${TARGET.cashbackRedemption} → ${TARGET.cashbackRedemption}: +${after - before} (${after} total)`);
    }
  } finally {
    await hzConn.end();
  }
}

async function applySrSchema(conn) {
  if (!fs.existsSync(SR_MIGRATION_SQL)) {
    throw new Error(`Ficheiro de migração não encontrado: ${SR_MIGRATION_SQL}`);
  }
  const sql = fs.readFileSync(SR_MIGRATION_SQL, "utf8");
  await conn.query({ sql, multipleStatements: true });
}

async function markPrismaMigrationApplied(databaseUrl) {
  const prismaEnv = { ...process.env, DATABASE_URL: databaseUrl };
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", env: prismaEnv });
  } catch (err) {
    const msg = String(err?.stderr ?? err?.message ?? err);
    if (msg.includes("P3005")) {
      console.log("Base não vazia sem histórico Prisma; a marcar migração como aplicada...");
      execSync('npx prisma migrate resolve --applied "20260714120000_init_sr_schema"', {
        stdio: "inherit",
        env: prismaEnv,
      });
      return;
    }
    console.warn("Aviso: prisma migrate deploy falhou (schema já aplicado via SQL).", msg);
  }
}

async function main() {
  const targetUrl = resolveDatabaseUrlFromEnv();
  if (!targetUrl) {
    console.error("Defina DATABASE_URL ou MYSQL_* apontando para u494944867_sol.");
    process.exit(1);
  }

  const target = parseUrl(targetUrl);
  console.log(`Alvo: ${target.database} @ ${target.host}`);

  process.env.DATABASE_URL = targetUrl;

  const conn = await mysql.createConnection({
    ...target,
    multipleStatements: true,
  });
  try {
    console.log("\n1) Criar tabelas sr_* (CREATE IF NOT EXISTS, sem apagar legado)...");
    await applySrSchema(conn);

    console.log("\n2) Migrar dados legados dentro de u494944867_sol...");
    await migrateUsersFromLegacy(conn);
    await migratePurchasesFromLegacy(conn);
    await migrateRedemptionsFromLegacy(conn);

    await migrateGenericById(conn, LEGACY_APP_SETTING_TABLE, TARGET.appSetting, ["key", "value"]);
    await migrateGenericById(conn, LEGACY_NOTIFICATION_TABLE, TARGET.notification, [
      "id",
      "user_id",
      "title",
      "body",
      "read_at",
      "created_at",
    ]);
    await migrateGenericById(conn, LEGACY_PWD_RESET_TABLE, TARGET.passwordResetToken, [
      "id",
      "user_id",
      "token_hash",
      "expires_at",
      "used_at",
      "created_at",
    ]);
    await migrateGenericById(conn, LEGACY_LEDGER_TABLE, TARGET.cashbackLedger, [
      "id",
      "user_id",
      "kind",
      "amount",
      "balance_after",
      "source",
      "ref_type",
      "ref_id",
      "metadata",
      "created_at",
    ]);

    console.log("\n3) Merge opcional de u494944867_horyzonn...");
    await mergeFromHoryzonn(conn, process.env.HORYZONN_DATABASE_URL?.trim());

    console.log("\n4) Registar migração Prisma...");
    await markPrismaMigrationApplied(targetUrl);

    console.log("\n✅ Migração concluída. O projeto usa somente", target.database);
    console.log("   Tabelas: sr_User, sr_Purchase, sr_CashbackRedemption, ...");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
