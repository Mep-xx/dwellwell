// src/lib/tokens.ts
import jwt from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const ACCESS_TTL  = process.env.ACCESS_TOKEN_TTL  || '15m'; // keep as a string like '15m'
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '30d';

export function signAccessToken(user: { id: string; role?: string }) {
  const payload = { userId: user.id, role: user.role };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(user: { id: string; role?: string }) {
  const payload = { userId: user.id, role: user.role };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as any;
}
