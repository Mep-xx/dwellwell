//dwellwell-api/src/routes/auth/signup.ts
import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { hashPassword, hashToken, signAccess, signRefresh } from '../../utils/auth';
import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';

export default async function signup(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'EMAIL_IN_USE' });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: 'user' },
  });

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const tokenHash = await hashToken(refreshToken);
  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);

  await prisma.refreshSession.create({
    data: { userId: user.id, tokenHash, userAgent: ua, ip, expiresAt },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: COOKIE_SAMESITE,     // 'none' if cross-site; 'lax' if same-site
    secure: COOKIE_SECURE,         // true in production
    maxAge: REFRESH_MAX_AGE_MS,    // long-lived
    path: REFRESH_COOKIE_PATH,     // limit scope to /api/auth
  });

  res.cookie(REFRESH_HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });

  return res.status(201).json({ accessToken, user: { id: user.id, email: user.email, role: user.role } });
}
