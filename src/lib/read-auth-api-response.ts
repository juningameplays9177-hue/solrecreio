/**
 * Lê JSON das rotas /api/auth/* e trata respostas HTML de erro (ex.: 502/503 do proxy da hospedagem).
 */
export async function readAuthApiJson<TResult extends Record<string, unknown>>(
  res: Response,
  fallbackError: string
): Promise<{ ok: true; data: TResult } | { ok: false; message: string }> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const data = (await res.json().catch(() => ({}))) as TResult;
    if (!res.ok) {
      const err = (data as { error?: unknown }).error;
      const message =
        typeof err === "string" ? err : fallbackMessage(res.status, fallbackError);
      return { ok: false, message };
    }
    return { ok: true, data };
  }

  if (res.status === 503 || res.status === 502 || res.status === 504) {
    return {
      ok: false,
      message:
        "A hospedagem respondeu como indisponível (502/503/504). Costuma ser MySQL parado, DATABASE_URL/AUTH_SECRET em falta, timeout do nginx ou app Node a reiniciar. Confira o painel da Hostinger, aguarde um minuto e tente de novo.",
    };
  }

  return {
    ok: false,
    message:
      "Resposta inválida do servidor (não é JSON). Atualize a página e tente novamente.",
  };
}

function fallbackMessage(status: number, fallback: string): string {
  if (status === 503 || status === 502 || status === 504) {
    return "Servidor indisponível temporariamente. Verifique MySQL e variáveis de ambiente na hospedagem, ou tente de novo em instantes.";
  }
  return fallback;
}
