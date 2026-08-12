import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isAccountLocked(lockUntil?: Date): boolean {
  return !!lockUntil && lockUntil > new Date();
}

export function getLockUntil(attempts: number): Date | undefined {
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    return new Date(Date.now() + LOCK_TIME_MS);
  }
  return undefined;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `EMA-${ts}-${rand}`;
}

export function generateVerificationCode(): string {
  return crypto.randomBytes(16).toString("hex").slice(0, 12).toUpperCase();
}
