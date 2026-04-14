/**
 * Evita ligação a ::1 quando o painel diz "localhost" (Node + MySQL Hostinger).
 * @see src/lib/db.ts resolveMysqlTcpHostname
 */
export function normalizeMysqlHostForNode(hostname) {
  if (typeof hostname !== "string" || !hostname.length) return hostname;
  const h = hostname.toLowerCase();
  if (h !== "localhost") return hostname;
  const rawKeep = process.env.MYSQL_KEEP_LOCALHOST;
  const v = typeof rawKeep === "string" ? rawKeep.trim().toLowerCase() : "";
  if (v === "1" || v === "true") return "localhost";
  return "127.0.0.1";
}
