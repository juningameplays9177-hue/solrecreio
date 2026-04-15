/** Teto de saldo de cashback por usuário (R$). */
export const CASHBACK_WALLET_MAX_BRL = 100;

export function roundMoneyBrl(n: number): number {
  return Math.round(n * 100) / 100;
}
