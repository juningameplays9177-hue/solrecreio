import { mkdir } from "fs/promises";
import { join, relative, resolve, sep } from "path";

const STORED_PREFIX = "uploads/cashback/";

/**
 * Diretório absoluto dos anexos de NF (cashback).
 * Em Hostinger/outros deploys, defina `CASHBACK_UPLOAD_DIR` para uma pasta persistente
 * (fora de releases que são substituídos a cada deploy).
 */
export function getCashbackUploadDir(): string {
  const raw = process.env.CASHBACK_UPLOAD_DIR?.trim();
  if (raw) return resolve(raw);
  return resolve(process.cwd(), "uploads", "cashback");
}

/** Caminho no disco para um `file_path` guardado na BD (ex.: `uploads/cashback/1-123-nf.pdf`). */
export function resolveStoredInvoiceAbsolutePath(storedPath: string): string | null {
  const normalized = String(storedPath).replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith(STORED_PREFIX)) return null;
  const rest = normalized.slice(STORED_PREFIX.length);
  if (!rest || rest.split("/").some((p) => p === ".." || p === "")) return null;

  const root = resolve(getCashbackUploadDir());
  const abs = resolve(root, ...rest.split("/"));
  const rel = relative(root, abs);
  if (rel.startsWith("..") || rel.includes("..")) return null;

  const prefix = root.endsWith(sep) ? root : root + sep;
  if (abs !== root && !abs.startsWith(prefix)) return null;

  return abs;
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function safeInvoiceFilename(original: string): string {
  const base = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "nf";
}

export function assertAllowedInvoiceFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return "Arquivo muito grande (máx. 5 MB).";
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(type)) {
    return "Formato não permitido. Use PDF, JPG, PNG ou WEBP.";
  }
  return null;
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(getCashbackUploadDir(), { recursive: true });
}
