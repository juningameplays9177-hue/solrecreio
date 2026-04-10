/**
 * Gera public/qr-entrar.png — QR que abre a página inicial do site.
 * Uso: node scripts/generate-qr-entrar-png.mjs [URL]
 * Ex.: node scripts/generate-qr-entrar-png.mjs "https://exemplo.com/"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "public", "qr-entrar.png");

const defaultUrl = "https://skyblue-lark-202006.hostingersite.com/";
const url = process.argv[2]?.trim() || defaultUrl;

await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
await QRCode.toFile(outPath, url, {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#1a1a1a", light: "#ffffff" },
});

console.log(`OK: ${outPath}\n   → ${url}`);
