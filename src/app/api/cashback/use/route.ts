import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
import { ensureCashbackLedgerSchema } from "@/lib/cashback-ledger-schema";
import { roundMoneyBrl } from "@/lib/cashback-wallet-constants";
import { normalizeCashbackAmount } from "@/lib/cashback-redemptions";
import { getClientIp, rateLimitMemory } from "@/lib/rate-limit-memory";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { debitCashbackWallet } from "@/services/cashback-wallet-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  amount: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n >= 0.01, "Informe um valor válido")
    .refine((n) => n <= 100_000, "Valor muito alto"),
});

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const ip = getClientIp(request);
    const limited = rateLimitMemory(`cashback:use:${ip}`, 60, 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Aguarde ${limited.retryAfterSec}s antes de novas operações.` },
        { status: 429 }
      );
    }

    const session = await getSessionFromCookies();
    const denied = denyUnlessClientWithCompleteProfile(session);
    if (denied) return denied;

    const client = asClientSessionReady(session);
    const userId = Number(client.sub);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.amount?.[0] ?? "Dados inválidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const amount = roundMoneyBrl(normalizeCashbackAmount(parsed.data.amount));
    const pool = getPool();
    await ensureCashbackLedgerSchema(pool);

    const conn = await pool.getConnection();
    let result: Awaited<ReturnType<typeof debitCashbackWallet>>;
    try {
      await conn.beginTransaction();
      result = await debitCashbackWallet(conn, userId, amount, {
        source: "wallet_use",
      });
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Saldo insuficiente") || msg.includes("inválido")) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      throw e;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      ok: true,
      debited: result.debited,
      balanceAfter: result.balanceAfter,
      message: `Foram utilizados R$ ${result.debited.toFixed(2)} de cashback.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao usar cashback.") },
      { status: 500 }
    );
  }
}
