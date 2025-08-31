// dwellwell-api/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh';

// Short access, long refresh (adjust via env)
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '60m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '180d'; // long-lived

export function signAccess(p: { userId: string; role: string }) {
  return jwt.sign(p, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Refresh tokens are still JWTs (so we can read sub/role if needed),
// but we treat them like opaque secrets: hash + store in DB, rotate on use.
export function signRefresh(p: { userId: string; role: string }) {
  return jwt.sign(p, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}
export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}

// Hash refresh tokens for DB storage (bcrypt is fine here)
export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}
export async function compareToken(raw: string, hashed: string) {
  return bcrypt.compare(raw, hashed);
}

// Utilities
export async function hashPassword(pwd: string) { return bcrypt.hash(pwd, 10); }
export async function comparePassword(raw: string, hashed: string) { return bcrypt.compare(raw, hashed); }

// For anti-CSRF on refresh (optional but recommended if you ever move refresh off sameSite=None)
// You can also set an extra non-HttpOnly cookie with a random value and check it in /refresh.
export function randomId(len = 32) {
  return crypto.randomBytes(len).toString('hex');
}
