import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function fromAddress(): string | null {
  const a =
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.RESEND_FROM?.trim();
  return a && a.includes("@") ? a : null;
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = fromAddress();
  if (!key || !from) {
    throw new Error("RESEND_API_KEY ou remetente (EMAIL_FROM) não configurado.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend HTTP ${res.status}: ${errText || res.statusText}`);
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "";
  const from = fromAddress();
  if (!host || !portRaw || !from) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT e remetente (EMAIL_FROM) são obrigatórios para SMTP."
    );
  }
  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT inválido.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: String(pass) } : undefined,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

/**
 * Envia e-mail transacional: tenta Resend se `RESEND_API_KEY` existir;
 * caso contrário usa Nodemailer + SMTP.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(input);
    return;
  }
  await sendViaSmtp(input);
}

export function isEmailTransportConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim() && fromAddress()) return true;
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  return Boolean(host && port && fromAddress());
}
