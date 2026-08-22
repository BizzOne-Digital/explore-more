import type SMTPTransport from "nodemailer/lib/smtp-transport";

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Normalize SMTP env vars (trim whitespace; strip spaces from app passwords). */
export function getSmtpSettings() {
  const host = trimEnv(process.env.SMTP_HOST);
  const port = parseInt(trimEnv(process.env.SMTP_PORT) || "587", 10);
  const username = trimEnv(process.env.SMTP_USERNAME);
  const password = trimEnv(process.env.SMTP_PASSWORD).replace(/\s+/g, "");
  const senderName = trimEnv(process.env.SMTP_SENDER_NAME) || "Explore More Academy";
  const senderEmail = trimEnv(process.env.SMTP_SENDER_EMAIL) || username;
  const replyTo = trimEnv(process.env.SMTP_REPLY_TO) || username;

  return { host, port, username, password, senderName, senderEmail, replyTo };
}

export function isSmtpConfigured(): boolean {
  const { host, username, password } = getSmtpSettings();
  return !!(host && username && password);
}

function isGmailHost(host: string, username: string): boolean {
  const normalized = host.toLowerCase();
  return normalized.includes("gmail") || username.toLowerCase().endsWith("@gmail.com");
}

/** Gmail requires the From address to match the authenticated account. */
export function getSmtpFromAddress(settings: ReturnType<typeof getSmtpSettings>): string {
  const fromEmail = isGmailHost(settings.host, settings.username)
    ? settings.username
    : settings.senderEmail || settings.username;

  return `"${settings.senderName}" <${fromEmail}>`;
}

export function createSmtpTransportOptions(
  settings: ReturnType<typeof getSmtpSettings>
): SMTPTransport.Options | { service: string; auth: { user: string; pass: string } } {
  const auth = { user: settings.username, pass: settings.password };

  if (isGmailHost(settings.host, settings.username)) {
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth,
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
      tls: { minVersion: "TLSv1.2" },
    };
  }

  return {
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    requireTLS: settings.port === 587,
    auth,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  };
}
