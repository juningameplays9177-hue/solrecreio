import { mkdir } from "fs/promises";
import { join } from "path";

export const CASHBACK_UPLOAD_DIR = join(process.cwd(), "uploads", "cashback");

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
  await mkdir(CASHBACK_UPLOAD_DIR, { recursive: true });
}
