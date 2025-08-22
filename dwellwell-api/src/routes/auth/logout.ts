import type { Request, Response } from 'express';

export default async function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: (process.env.COOKIE_SAMESITE as any) || 'none', secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true });
}
