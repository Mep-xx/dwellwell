// dwellwell-api/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import argon2 from 'argon2';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh';

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '60m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '180d';

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'dev-pepper';

// ---------------- JWT ----------------
export function signAccess(p: { userId: string; role: string }) {
  return jwt.sign(p, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}
export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}
export function signRefresh(p: { userId: string; role: string }) {
  return jwt.sign(p, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}
export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}

// -------- refresh token hashing ------
export async function hashToken(token: string) {
  return bcrypt.hash(token, 12);
}
export async function compareToken(raw: string, hashed: string) {
  return bcrypt.compare(raw, hashed);
}

// -------- password hashing (Argon2id + pepper + versioning)
const ARGON2_OPTS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
};
const PWD_VERSION = 'v2-argon2id';

export async function hashPassword(plain: string): Promise<string> {
  const secret = plain + PASSWORD_PEPPER;
  const hash = await argon2.hash(secret, ARGON2_OPTS);
  return `${PWD_VERSION}:${hash}`;
}

export async function comparePasswordVersioned(
  plain: string,
  stored?: string | null
): Promise<{ ok: boolean; shouldRehash: boolean }> {
  if (!stored) return { ok: false, shouldRehash: false };

  if (stored.startsWith('v2-argon2id:')) {
    const hash = stored.slice('v2-argon2id:'.length);
    const ok = await argon2.verify(hash, plain + PASSWORD_PEPPER);
    // If you ever bump params, inspect hash params and set shouldRehash = true
    return { ok, shouldRehash: false };
  }

  // Legacy bcrypt (no prefix) – run until all users are migrated
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    const okWithoutPepper = await bcrypt.compare(plain, stored);
    if (okWithoutPepper) return { ok: true, shouldRehash: true };

    const okWithPepper = await bcrypt.compare(plain + PASSWORD_PEPPER, stored);
    if (okWithPepper) return { ok: true, shouldRehash: true };

    return { ok: false, shouldRehash: false };
  }

  return { ok: false, shouldRehash: false };
}

// Convenience wrapper for boolean checks
export async function comparePasswordOk(plain: string, stored?: string | null) {
  const { ok } = await comparePasswordVersioned(plain, stored);
  return ok;
}

// Anti-CSRF helper if you ever want it
export function randomId(len = 32) {
  return crypto.randomBytes(len).toString('hex');
}
