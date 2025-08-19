// dwellwell-api/src/controllers/auth.ts
import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import bcrypt from 'bcrypt'; // using bcrypt (not bcryptjs) to match your current deps
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? '30d'; // can be '7d' if you prefer
const REFRESH_COOKIE_NAME = 'refreshToken';
const isProd = process.env.NODE_ENV === 'production';

function signAccess(payload: { userId: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET as Secret, { expiresIn: ACCESS_TOKEN_TTL } as SignOptions);
}
function signRefresh(payload: { userId: string; role: string }) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as Secret, { expiresIn: REFRESH_TOKEN_TTL } as SignOptions);
}

/**
 * POST /api/auth/signup
 * Creates a user, issues tokens, and sets the refresh cookie.
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const rawEmail = String(req.body?.email || '');
    const email = rawEmail.trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, role: 'user' },
    });

    const accessToken = signAccess({ userId: user.id, role: user.role });
    const refreshToken = signRefresh({ userId: user.id, role: user.role });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/auth/refresh',
      // keep cookie lifetime aligned with REFRESH_TOKEN_TTL
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/login
 * Always returns 200 with `{ ok }` to avoid 401 noise on the login screen.
 * Bad creds => { ok:false, code: 'INVALID_CREDENTIALS' }
 */
export const login = async (req: Request, res: Response) => {
  try {
    const rawEmail = String(req.body?.email || '');
    const email = rawEmail.trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.json({ ok: false, code: 'BAD_REQUEST', message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // normalize timing to avoid user existence oracle
      await bcrypt.compare(
        'dummy',
        '$2b$10$QFMUuCw8qQbJ0Z2m5wq7heqL5CqvK2i3m.3F0vDqKq0K8m8C2I6w2' // any valid bcrypt hash
      );
      return res.json({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const accessToken = signAccess({ userId: user.id, role: user.role });
    const refreshToken = signRefresh({ userId: user.id, role: user.role });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      ok: true,
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.json({ ok: false, code: 'SERVER_ERROR', message: 'Something went wrong.' });
  }
};

/**
 * POST /api/auth/refresh
 * Reads the HttpOnly refresh cookie and mints a short-lived access token.
 * Keeps proper 401 semantics here (this is not the login page).
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as Secret
    ) as JwtPayload & { userId: string; role?: string };

    // Prefer role from refresh token; if missing, read from DB
    let role = decoded.role;
    if (!role) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      role = user?.role;
    }
    if (!role) {
      return res.status(401).json({ message: 'Unable to resolve user role' });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId, role },
      process.env.JWT_SECRET as Secret,
      { expiresIn: ACCESS_TOKEN_TTL } as SignOptions
    );

    return res.json({ accessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: err.message || 'Invalid refresh token' });
  }
};

/**
 * POST /api/auth/logout
 * Clears the refresh cookie.
 */
export const logout = (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth/refresh',
  });
  return res.json({ message: 'Logged out successfully' });
};