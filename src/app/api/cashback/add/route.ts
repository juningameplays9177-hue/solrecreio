import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
import { computeCashbackCredit, getCashbackPercentage } from "@/lib/app-settings";
import { ensureCashbackLedgerSchema } from "@/lib/cashback-ledger-schema";
import { roundMoneyBrl } from "@/lib/cashback-wallet-constants";
import { getClientIp, rateLimitMemory } from "@/lib/rate-limit-memory";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { creditCashbackCapped } from "@/services/cashback-wallet-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Valor da compra em R$ (cashback = porcentagem configurada sobre este valor). */
  purchaseAmount: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n >= 0.01, "Informe o valor da compra")
    .refine((n) => n <= 1_000_000, "Valor muito alto"),
});

export async function POST(request: Request) {
  try {
    const envErrs = getServerEnvErrors();
    if (envErrs.length > 0) {
      return NextResponse.json({ error: envErrs[0] }, { status: 500 });
    }

    const ip = getClientIp(request);
    const limited = rateLimitMemory(`cashback:add:${ip}`, 60, 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Aguarde ${limited.retryAfterSec}s antes de novos lançamentos.` },
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
      const msg =
        parsed.error.flatten().fieldErrors.purchaseAmount?.[0] ?? "Dados inválidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const purchaseAmount = roundMoneyBrl(parsed.data.purchaseAmount);
    const pool = getPool();
    await ensureCashbackLedgerSchema(pool);
    const pct = await getCashbackPercentage(pool);
    const computedCredit = computeCashbackCredit(purchaseAmount, pct);

    const conn = await pool.getConnection();
    let result: Awaited<ReturnType<typeof creditCashbackCapped>>;
    try {
      await conn.beginTransaction();
      result = await creditCashbackCapped(conn, userId, computedCredit, {
        source: "purchase",
        metadata: { purchaseAmount, cashbackPercentage: pct, computedCredit },
      });
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      ok: true,
      purchaseAmount,
      cashbackPercentage: pct,
      computedCredit,
      credited: result.credited,
      balanceAfter: result.balanceAfter,
      capped: result.capped,
      message:
        result.credited <= 0
          ? "Saldo já está no limite de R$ 100,00 — nenhum cashback adicional neste lançamento."
          : result.capped
            ? `Foram creditados R$ ${result.credited.toFixed(2)} (teto de R$ 100,00 aplicado).`
            : `Cashback de R$ ${result.credited.toFixed(2)} creditado.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao creditar cashback.") },
      { status: 500 }
    );
  }
}
