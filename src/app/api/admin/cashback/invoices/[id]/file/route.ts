import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth";
import { getServerEnvErrors } from "@/lib/server-env";
import { resolveStoredInvoiceAbsolutePath } from "@/lib/upload-invoice";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function guessContentType(filename: string): string {
  const lower = filename.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }
    const session = await getSessionFromCookies();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT file_path, original_filename FROM cashback_invoices WHERE id = ? LIMIT 1",
      [id]
    );
    const row = rows[0];
    if (!row?.file_path) {
      return NextResponse.json({ error: "Arquivo não enviado nesta solicitação." }, { status: 404 });
    }

    const abs = resolveStoredInvoiceAbsolutePath(String(row.file_path));
    if (!abs) {
      return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
    }
    if (!existsSync(abs)) {
      return NextResponse.json(
        {
          error:
            "Arquivo não encontrado no disco. Se a app foi redeployada, use uma pasta persistente: defina CASHBACK_UPLOAD_DIR no servidor com o mesmo caminho onde os uploads são guardados.",
        },
        { status: 404 }
      );
    }

    const downloadName =
      typeof row.original_filename === "string" && row.original_filename
        ? row.original_filename
        : `nf-${id}`;

    const buf = await readFile(abs);
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    );
    headers.set("Content-Type", guessContentType(downloadName));

    return new NextResponse(buf, { headers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao abrir arquivo." }, { status: 500 });
  }
}
