/**
 * postinstall: Prisma CLI so le DATABASE_URL; a app usa MYSQL_*.
 * Na Hostinger (sem .env) define DATABASE_URL a partir de MYSQL_* ou URL dummy so para generate.
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { resolveDatabaseUrlFromEnv } from "./resolve-database-url.mjs";

const BUILD_DUMMY_URL = "mysql://build:build@127.0.0.1:3306/build";

const url = resolveDatabaseUrlFromEnv() || process.env.DATABASE_URL?.trim() || BUILD_DUMMY_URL;
process.env.DATABASE_URL = url;

execSync("npx prisma generate", { stdio: "inherit", env: process.env });
