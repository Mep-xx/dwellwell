import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { hashPassword } from '../../utils/auth';

const ACCESS_SECRET: jwt.Secret = (process.env.JWT_SECRET || 'dev-secret') as jwt.Secret;
const REFRESH_SECRET: jwt.Secret = (process.env.REFRESH_TOKEN_SECRET || 'dev-refresh') as jwt.Secret;
const ACCESS_TTL: jwt.SignOptions['expiresIn'] = (process.env.ACCESS_TOKEN_TTL as any) || '15m';
const REFRESH_TTL: jwt.SignOptions['expiresIn'] = (process.env.REFRESH_TOKEN_TTL as any) || '30d';

const COOKIE_SAMESITE: 'none' | 'lax' = ((process.env.COOKIE_SAMESITE as any) || 'none') as any;
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export default async function signup(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'EMAIL_IN_USE' });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: 'user' },
    select: { id: true, email: true, role: true },
  });

  const payload = { userId: user.id, role: user.role };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: COOKIE_SAMESITE,
    secure: COOKIE_SECURE,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  return res.status(201).json({ accessToken, user });
}
