//dwellwell-api/src/routes/auth/refresh.ts
import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { compareToken, hashToken, signAccess, signRefresh, verifyRefresh } from '../../utils/auth';
import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';

const IDLE_MAX_DAYS = Number(process.env.REFRESH_IDLE_MAX_DAYS ?? 0); // 0 = disabled
const ROTATION_GRACE_MS = Number(process.env.REFRESH_ROTATION_GRACE_MS ?? 15000);
const MAX_CHAIN_HOPS = 5;
const DEV = process.env.NODE_ENV !== 'production';

function fail(res: Response, code: 'UNAUTHORIZED' | 'TOKEN_EXPIRED', detail: string) {
  if (DEV) {
    return res.status(401).json({ error: code, detail });
  }
  return res.status(401).json({ error: code });
}

export default async function refresh(req: Request, res: Response) {
  const incoming = (req as any).cookies?.refreshToken as string | undefined;
  if (!incoming) {
    return fail(res, 'UNAUTHORIZED', 'NO_COOKIE');
  }

  let decoded: { userId: string; role?: string };
  try {
    decoded = verifyRefresh(incoming) as any;
  } catch {
    return fail(res, 'TOKEN_EXPIRED', 'REFRESH_JWT_INVALID_OR_EXPIRED');
  }

  const userId = decoded.userId;
  const role = decoded.role || 'user';

  const sessions = await prisma.refreshSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  let matched: (typeof sessions)[number] | null = null;
  for (const s of sessions) {
    if (await compareToken(incoming, s.tokenHash)) { matched = s; break; }
  }

  if (!matched) {
    // Just clear cookies for this browser
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
    res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
    return fail(res, 'UNAUTHORIZED', 'NO_MATCHING_SESSION');
  }

  if (IDLE_MAX_DAYS > 0) {
    const idleMs = Date.now() - new Date(matched.lastUsedAt).getTime();
    const maxIdleMs = IDLE_MAX_DAYS * 24 * 60 * 60 * 1000;
    if (idleMs > maxIdleMs) {
      await prisma.refreshSession.update({ where: { id: matched.id }, data: { revokedAt: new Date() } });
      res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
      res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
      return fail(res, 'TOKEN_EXPIRED', 'IDLE_TIMEOUT');
    }
  }

  if (matched.replacedById) {
    // Follow chain to newest
    let cursor = matched;
    let hops = 0;
    while (cursor.replacedById && hops < MAX_CHAIN_HOPS) {
      const next = await prisma.refreshSession.findUnique({ where: { id: cursor.replacedById } });
      if (!next) break;
      cursor = next;
      hops++;
    }

    const recent = Date.now() - new Date(cursor.createdAt).getTime() <= ROTATION_GRACE_MS;
    const stillValid = !cursor.revokedAt && cursor.expiresAt > new Date();

    if (recent && stillValid) {
      const newRefresh = signRefresh({ userId, role });
      const newHash = await hashToken(newRefresh);
      const ua = req.headers['user-agent'] || '';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
      const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);

      await prisma.$transaction(async (tx) => {
        await tx.refreshSession.update({
          where: { id: cursor.id },
          data: { revokedAt: new Date(), lastUsedAt: new Date() },
        });

        const createdInner = await tx.refreshSession.create({
          data: { userId, tokenHash: newHash, userAgent: ua, ip, expiresAt, lastUsedAt: new Date() },
        });

        await tx.refreshSession.update({
          where: { id: cursor.id },
          data: { replacedById: createdInner.id },
        });
      });

      const accessToken = signAccess({ userId, role });

      res.cookie('refreshToken', newRefresh, {
        httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE,
        maxAge: REFRESH_MAX_AGE_MS, path: REFRESH_COOKIE_PATH,
      });
      res.cookie(REFRESH_HINT_COOKIE, '1', {
        httpOnly: false, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE,
        maxAge: REFRESH_MAX_AGE_MS, path: REFRESH_COOKIE_PATH,
      });

      return res.json({ accessToken });
    }

    // Outside grace → replay or stale chain
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
    res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });
    return fail(res, 'UNAUTHORIZED', 'ROTATION_REPLAY_OR_STALE_CHAIN');
  }

  // Normal rotate
  const newRefresh = signRefresh({ userId, role });
  const newHash = await hashToken(newRefresh);
  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);

  await prisma.$transaction(async (tx) => {
    await tx.refreshSession.update({
      where: { id: matched!.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });

    const createdInner = await tx.refreshSession.create({
      data: { userId, tokenHash: newHash, userAgent: ua, ip, expiresAt, lastUsedAt: new Date() },
    });

    await tx.refreshSession.update({
      where: { id: matched!.id },
      data: { replacedById: createdInner.id },
    });
  });

  const accessToken = signAccess({ userId, role });

  res.cookie('refreshToken', newRefresh, {
    httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS, path: REFRESH_COOKIE_PATH,
  });
  res.cookie(REFRESH_HINT_COOKIE, '1', {
    httpOnly: false, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE_MS, path: REFRESH_COOKIE_PATH,
  });

  return res.json({ accessToken });
}