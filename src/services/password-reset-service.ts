import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import { getPublicSiteOrigin } from "@/lib/site-url";
import {
  isEmailTransportConfigured,
  sendTransactionalEmail,
} from "@/lib/email/send-transactional-email";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

async function loadUserIdByEmail(
  conn: PoolConnection,
  email: string
): Promise<number | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const id = rows[0]?.id;
  return id != null ? Number(id) : null;
}

/**
 * Cria token e envia e-mail. Não revela se o e-mail existe.
 * `conn` deve estar em transação; faz commit pelo caller após esta função.
 */
export async function createPasswordResetFlow(
  conn: PoolConnection,
  emailNorm: string
): Promise<{ userId: number; rawToken: string } | null> {
  const userId = await loadUserIdByEmail(conn, emailNorm);
  if (userId == null) return null;

  await conn.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL`,
    [userId]
  );

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await conn.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expires]
  );

  return { userId, rawToken };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  rawToken: string
): Promise<void> {
  const origin = getPublicSiteOrigin();
  const link = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const subject = "Redefinição de senha — Sol do Recreio";
  const text = [
    "Recebemos um pedido para redefinir a senha da sua conta.",
    "",
    `Abra o link abaixo (válido por 15 minutos):`,
    link,
    "",
    "Se você não solicitou, ignore este e-mail.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0f172a">
  <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
  <p><a href="${link}" style="display:inline-block;margin:12px 0;padding:12px 20px;background:#b71c1c;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Redefinir senha</a></p>
  <p style="font-size:13px;color:#64748b">O link expira em 15 minutos. Se você não solicitou, ignore este e-mail.</p>
  <p style="font-size:12px;color:#94a3b8;word-break:break-all">${link}</p>
</body></html>`;

  if (!isEmailTransportConfigured()) {
    console.warn(
      "password-reset: e-mail não enviado — configure RESEND_API_KEY + EMAIL_FROM ou SMTP_* + EMAIL_FROM."
    );
    return;
  }

  await sendTransactionalEmail({ to: toEmail, subject, text, html });
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; code: "INVALID" | "EXPIRED" | "USED" };

export async function resetPasswordWithToken(
  conn: PoolConnection,
  rawToken: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  if (!rawToken || rawToken.length < 16) {
    return { ok: false, code: "INVALID" };
  }
  const tokenHash = hashResetToken(rawToken);

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, user_id, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ?
     FOR UPDATE`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return { ok: false, code: "INVALID" };

  if (row.used_at != null) {
    return { ok: false, code: "USED" };
  }

  const exp =
    row.expires_at instanceof Date
      ? row.expires_at.getTime()
      : new Date(String(row.expires_at)).getTime();
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, code: "EXPIRED" };
  }

  const userId = Number(row.user_id);
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await conn.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
    passwordHash,
    userId,
  ]);
  await conn.query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
    [row.id]
  );

  return { ok: true };
}

export async function validateResetTokenRow(
  conn: PoolConnection,
  rawToken: string
): Promise<{ valid: true } | { valid: false; code: "INVALID" | "EXPIRED" | "USED" }> {
  if (!rawToken || rawToken.length < 16) {
    return { valid: false, code: "INVALID" };
  }
  const tokenHash = hashResetToken(rawToken);
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return { valid: false, code: "INVALID" };
  if (row.used_at != null) return { valid: false, code: "USED" };
  const exp =
    row.expires_at instanceof Date
      ? row.expires_at.getTime()
      : new Date(String(row.expires_at)).getTime();
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { valid: false, code: "EXPIRED" };
  }
  return { valid: true };
}
