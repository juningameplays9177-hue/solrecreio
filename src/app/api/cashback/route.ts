import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import {
  asClientSessionReady,
  denyUnlessClientWithCompleteProfile,
  getSessionFromCookies,
} from "@/lib/auth";
import { ensureCashbackLedgerSchema } from "@/lib/cashback-ledger-schema";
import { apiErrorMessage, getServerEnvErrors } from "@/lib/server-env";
import { getCashbackWalletSummary } from "@/services/cashback-wallet-service";

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
    const userId = Number(client.sub);
    const pool = getPool();
    await ensureCashbackLedgerSchema(pool);

    const summary = await getCashbackWalletSummary(pool, userId);
    return NextResponse.json(summary);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: apiErrorMessage(e, "Erro ao carregar carteira de cashback.") },
      { status: 500 }
    );
  }
}
