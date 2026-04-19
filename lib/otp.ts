import { createHash, randomInt } from 'crypto';

const DEFAULT_OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

function getOtpSecret() {
  return process.env.OTP_SECRET || 'dev-otp-secret-change-me';
}

export function getOtpExpiryMinutes() {
  const value = Number(process.env.OTP_EXPIRY_MINUTES ?? DEFAULT_OTP_EXPIRY_MINUTES);
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_OTP_EXPIRY_MINUTES;
  }
  return Math.floor(value);
}

export function createOtpCode() {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, '0');
}

export function hashOtp(email: string, otp: string) {
  return createHash('sha256')
    .update(`${email.trim().toLowerCase()}:${otp}:${getOtpSecret()}`)
    .digest('hex');
}

export function createOtpExpiry() {
  const minutes = getOtpExpiryMinutes();
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(date: Date) {
  return date.getTime() < Date.now();
}
