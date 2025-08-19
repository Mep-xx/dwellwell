import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_COOKIE_NAME = 'refreshToken';
const isProd = process.env.NODE_ENV === 'production';

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, role: 'user' },
    });

    // Access token includes role
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Refresh token includes role so refresh can re-mint role-bearing access tokens
    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    // Dev-friendly cookie options
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User fetched from DB:', user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Access token includes role
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Refresh token includes role
    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    // Dev-friendly cookie options
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('Generated token payload:', jwt.decode(accessToken));
    return res.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!
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
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    return res.json({ accessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: err.message || 'Invalid refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth/refresh',
  });
  return res.json({ message: 'Logged out successfully' });
};
