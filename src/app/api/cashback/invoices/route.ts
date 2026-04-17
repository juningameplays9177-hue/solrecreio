import { writeFile } from "fs/promises";

import { join } from "path";

import { NextResponse } from "next/server";

import { getPool } from "@/lib/db";

import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";

import {
  assertAllowedInvoiceFile,
  ensureUploadDir,
  getCashbackUploadDir,
  safeInvoiceFilename,
} from "@/lib/upload-invoice";

import { clampUserCashbackBalanceToMax } from "@/lib/clamp-user-cashback-balance";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";

import type { ResultSetHeader, RowDataPacket } from "mysql2";



export const runtime = "nodejs";



export async function GET() {

  try {

    const envErrs = getServerEnvErrors();

    if (envErrs.length > 0) {

      return NextResponse.json({ error: envErrs[0] }, { status: 500 });

    }

    const session = await getSessionFromCookies();

    const denied = denyUnlessClientWithCompleteProfile(session);

    if (denied) return denied;

    const client = asClientSessionReady(session);

    const pool = getPool();

    const userId = Number(client.sub);

    await clampUserCashbackBalanceToMax(pool, userId);

    const [balanceRows] = await pool.query<RowDataPacket[]>(

      "SELECT cashback_balance FROM users WHERE id = ? LIMIT 1",

      [userId]

    );

    const balance = Number(balanceRows[0]?.cashback_balance ?? 0);



    const [invoices] = await pool.query<

      (RowDataPacket & {

        id: number;

        amount: string;

        status: string;

        original_filename: string | null;

        created_at: Date;

      })[]

    >(

      `SELECT id, amount, status, original_filename, created_at

       FROM cashback_invoices WHERE user_id = ?

       ORDER BY created_at DESC LIMIT 50`,

      [userId]

    );



    return NextResponse.json({ balance, invoices });

  } catch (e) {

    console.error(e);

    return NextResponse.json(

      { error: apiErrorMessage(e, "Erro ao carregar dados.") },

      { status: 500 }

    );

  }

}



export async function POST(request: Request) {

  try {

    const envErrs = getServerEnvErrors();

    if (envErrs.length > 0) {

      return NextResponse.json({ error: envErrs[0] }, { status: 500 });

    }



    const session = await getSessionFromCookies();

    const denied = denyUnlessClientWithCompleteProfile(session);

    if (denied) return denied;

    const client = asClientSessionReady(session);

    const userId = Number(client.sub);

    const form = await request.formData();

    const amountRaw = form.get("amount");

    const file = form.get("file");



    const amountStr =

      typeof amountRaw === "string" ? amountRaw.replace(",", ".").trim() : "";

    const amount = parseFloat(amountStr);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999.99) {

      return NextResponse.json(

        { error: "Informe um valor válido (maior que zero)." },

        { status: 400 }

      );

    }



    let storedPath: string | null = null;

    let originalName: string | null = null;



    if (file instanceof File && file.size > 0) {

      const err = assertAllowedInvoiceFile(file);

      if (err) {

        return NextResponse.json({ error: err }, { status: 400 });

      }

      originalName = file.name;

      await ensureUploadDir();

      const buf = Buffer.from(await file.arrayBuffer());

      const safe = safeInvoiceFilename(file.name);

      const diskName = `${userId}-${Date.now()}-${safe}`;

      const absPath = join(getCashbackUploadDir(), diskName);

      await writeFile(absPath, buf);

      storedPath = join("uploads", "cashback", diskName);

    }



    const pool = getPool();

    const [result] = await pool.query<ResultSetHeader>(

      `INSERT INTO cashback_invoices (user_id, amount, status, file_path, original_filename)

       VALUES (?, ?, 'PENDING', ?, ?)`,

      [userId, amount.toFixed(2), storedPath, originalName]

    );



    return NextResponse.json({

      ok: true,

      id: result.insertId,

      message:

        "Solicitação registrada como pendente. Aguarde a análise do administrador.",

    });

  } catch (e) {

    console.error(e);

    return NextResponse.json(

      { error: apiErrorMessage(e, "Erro ao enviar nota fiscal.") },

      { status: 500 }

    );

  }

}

