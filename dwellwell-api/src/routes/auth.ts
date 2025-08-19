// dwellwell-api/src/routes/auth.ts
import { Router } from 'express';
import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import { signup, login } from '../controllers/auth';
import { prisma } from '../db/prisma';

const router = Router();

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_COOKIE_NAME = 'refreshToken';
const isProd = process.env.NODE_ENV === 'production';

// Public auth endpoints
router.post('/signup', signup);
router.post('/login', login);

/**
 * POST /api/auth/refresh
 * Uses the HttpOnly refresh cookie to mint a new short-lived access token.
 * Ensures the access token ALWAYS contains `role` (db lookup fallback).
 */
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(
      token,
      (process.env.REFRESH_TOKEN_SECRET as Secret)
    ) as JwtPayload & { userId: string; role?: string };

    // Prefer role from the refresh token; if missing, fetch from DB.
    let role = decoded.role;
    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true },
      });
      role = user?.role;
    }
    if (!role) {
      return res.status(401).json({ message: 'Unable to resolve user role' });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId, role },
      (process.env.JWT_SECRET as Secret),
      { expiresIn: ACCESS_TOKEN_TTL } as SignOptions
    );

    return res.json({ accessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: err.message || 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the refresh cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    // IMPORTANT: must match the cookie path used when setting it
    path: '/api/auth/refresh',
  });

  return res.json({ message: 'Logged out successfully' });
});

export default router;
