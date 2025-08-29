//dwellwell-api/src/routes/auth/logout.ts
import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { verifyRefresh } from '../../utils/auth';

import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';


export default async function logout(req: Request, res: Response) {
  const token = (req as any).cookies?.refreshToken as string | undefined;
  if (token) {
    try {
      const payload = verifyRefresh(token) as { userId: string; exp: number };
      // bulk revoke all sessions for this token’s user agent OR just wipe all sessions for the user
      // Simpler: wipe all sessions for the user (single-device logout uses UA match)
      await prisma.refreshSession.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // ignore
    }
  }

  res.clearCookie('refreshToken', { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, path: REFRESH_COOKIE_PATH });
  res.clearCookie(REFRESH_HINT_COOKIE, { path: REFRESH_COOKIE_PATH });

  return res.json({ ok: true });
}
