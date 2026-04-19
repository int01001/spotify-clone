import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

function parseBool(value: string | undefined, defaultValue: boolean) {
  if (!value) return defaultValue;
  return value.trim().toLowerCase() === 'true';
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portRaw) {
    throw new Error('SMTP is not configured. Set SMTP_HOST and SMTP_PORT in .env');
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    throw new Error('SMTP_PORT must be a valid number.');
  }

  const secure = parseBool(process.env.SMTP_SECURE, port === 465);

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

export async function sendSignupOtpEmail(params: {
  toEmail: string;
  name: string;
  otpCode: string;
  expiryMinutes: number;
}) {
  const smtpUser = process.env.SMTP_USER?.trim();
  const configuredFrom = process.env.SMTP_FROM?.trim();
  const from = configuredFrom || (smtpUser ? `Spotify Clone <${smtpUser}>` : undefined);
  if (!from) {
    throw new Error('Set SMTP_USER (and optionally SMTP_FROM) in .env');
  }

  const transporter = getTransporter();

  const { toEmail, name, otpCode, expiryMinutes } = params;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Your Spotify Clone OTP Code',
    text: `Hi ${name}, your OTP code is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
    html: `<p>Hi ${name},</p><p>Your OTP code is <strong>${otpCode}</strong>.</p><p>This code expires in ${expiryMinutes} minutes.</p>`,
  });
}

export function describeMailerError(error: unknown) {
  const candidate = error as { code?: string; response?: string; message?: string };
  const message = candidate?.response || candidate?.message || '';

  if (
    candidate?.code === 'EAUTH' ||
    message.includes('Username and Password not accepted') ||
    message.includes('BadCredentials')
  ) {
    return 'SMTP login failed. Generate a fresh Gmail app password and update SMTP_USER/SMTP_PASS.';
  }

  if (candidate?.code === 'ECONNECTION' || candidate?.code === 'ETIMEDOUT') {
    return 'SMTP server could not be reached. Check SMTP_HOST, SMTP_PORT, and your internet connection.';
  }

  return 'Unable to send OTP right now. Check SMTP setup.';
}
