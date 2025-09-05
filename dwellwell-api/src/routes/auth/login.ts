// dwellwell-api/src/routes/auth/login.ts
import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { comparePasswordVersioned, hashPassword, hashToken, signAccess, signRefresh } from '../../utils/auth';
import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';

export default async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  // If user is SSO-only (no local password), block password login
  if (user.authProvider === 'google' && !user.passwordHash) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const { ok, shouldRehash } = await comparePasswordVersioned(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  // Opportunistic rehash to Argon2id if they logged in with legacy bcrypt
  if (shouldRehash) {
    const newHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, passwordUpdatedAt: new Date(), authProvider: 'local' },
    });
  }

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
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });

  res.cookie(REFRESH_HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });

  return res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role } });
}
