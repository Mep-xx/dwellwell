// dwellwell-api/src/routes/auth/refresh.ts
import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { compareToken, hashToken, signAccess, signRefresh, verifyRefresh } from '../../utils/auth';
import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';

const IDLE_MAX_DAYS = Number(process.env.REFRESH_IDLE_MAX_DAYS ?? 0); // 0 = disabled

export default async function refresh(req: Request, res: Response) {
  const incoming = (req as any).cookies?.refreshToken as string | undefined;
  if (!incoming) return res.status(401).json({ error: 'UNAUTHORIZED' });

  let decoded: { userId: string; role?: string };
  try {
    decoded = verifyRefresh(incoming) as any;
  } catch {
    return res.status(401).json({ error: 'TOKEN_EXPIRED' });
  }

  const userId = decoded.userId;
  const role = decoded.role || 'user';

  const sessions = await prisma.refreshSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  let matched: (typeof sessions)[number] | null = null;
  for (const s of sessions) {
    if (await compareToken(incoming, s.tokenHash)) { matched = s; break; }
  }

  if (!matched) {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
    res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // Optional idle timeout
  if (IDLE_MAX_DAYS > 0) {
    const idleMs = Date.now() - new Date(matched.lastUsedAt).getTime();
    const maxIdleMs = IDLE_MAX_DAYS * 24 * 60 * 60 * 1000;
    if (idleMs > maxIdleMs) {
      await prisma.refreshSession.update({ where: { id: matched.id }, data: { revokedAt: new Date() } });
      res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
      res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
  }

  // Reuse detection: already rotated once
  if (matched.replacedById) {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
    res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // Rotate
  await prisma.refreshSession.update({
    where: { id: matched.id },
    data: { revokedAt: new Date() },
  });

  const newRefresh = signRefresh({ userId, role });
  const newHash = await hashToken(newRefresh);
  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);

  const created = await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: newHash,
      userAgent: ua,
      ip,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  await prisma.refreshSession.update({
    where: { id: matched.id },
    data: { replacedById: created.id },
  });

  const accessToken = signAccess({ userId, role });

  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });

  // set/update the hint cookie too
  res.cookie(REFRESH_HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });

  return res.json({ accessToken });
}
