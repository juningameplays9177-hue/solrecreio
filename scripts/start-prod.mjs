/**
 * Arranque em produção (ex.: Hostinger Node): o painel injeta PORT; o Next.js
 * não usa process.env.PORT por omissão — sem -p o proxy devolve 503.
 */
import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = "0.0.0.0";

const isWin = process.platform === "win32";
const cmd = isWin ? "npx.cmd" : "npx";
const args = ["next", "start", "-H", host, "-p", String(port)];

const child = spawn(cmd, args, {
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
