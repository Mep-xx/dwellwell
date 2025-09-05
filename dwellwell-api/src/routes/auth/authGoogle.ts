// dwellwell-api/src/routes/auth/authGoogle.ts
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../db/prisma';
import { signAccess, signRefresh, hashToken } from '../../utils/auth';
import { COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_COOKIE_PATH, REFRESH_MAX_AGE_MS, REFRESH_HINT_COOKIE } from '../../config/cookies';

const { GOOGLE_CLIENT_ID } = process.env;

if (!GOOGLE_CLIENT_ID) {
  console.warn('[authGoogle] Missing GOOGLE_CLIENT_ID env var');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID!);

export default async function authGoogle(req: Request, res: Response) {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) return res.status(400).json({ error: 'MISSING_GOOGLE_CREDENTIAL' });
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'SERVER_MISCONFIG', detail: 'GOOGLE_CLIENT_ID missing' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: 'INVALID_GOOGLE_TOKEN' });

    const { sub: googleId, email, name, picture, email_verified } = payload;
    if (!email) return res.status(400).json({ error: 'GOOGLE_NO_EMAIL' });
    if (email_verified === false) return res.status(400).json({ error: 'GOOGLE_EMAIL_UNVERIFIED' });

    const [firstName, ...rest] = (name ?? '').trim().split(' ');
    const lastName = rest.join(' ') || null;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        googleId,
        authProvider: 'google',
        // keep passwordHash as-is; if a local password already exists, leave it.
        profile: {
          upsert: {
            create: { firstName: firstName || null, lastName, avatarUrl: picture ?? null },
            update: { firstName: firstName || null, lastName, avatarUrl: picture ?? null },
          },
        },
      },
      create: {
        email,
        googleId,
        authProvider: 'google',
        passwordHash: null,
        role: 'user',
        profile: {
          create: { firstName: firstName || null, lastName, avatarUrl: picture ?? null },
        },
      },
      include: { profile: true },
    });

    // Issue tokens + create refresh session (match login/signup behavior)
    const payloadJwt = { userId: user.id, role: user.role };
    const accessToken = signAccess(payloadJwt);
    const refreshToken = signRefresh(payloadJwt);

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

    return res.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role as 'user' | 'admin' },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'GOOGLE_AUTH_FAILED' });
  }
}
