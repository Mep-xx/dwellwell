import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET: jwt.Secret = (process.env.JWT_SECRET || 'dev-secret') as jwt.Secret;
const REFRESH_SECRET: jwt.Secret = (process.env.REFRESH_TOKEN_SECRET || 'dev-refresh') as jwt.Secret;
const ACCESS_TTL: jwt.SignOptions['expiresIn'] = (process.env.ACCESS_TOKEN_TTL as any) || '15m';

export default async function refresh(req: Request, res: Response) {
  const token = (req as any).cookies?.refreshToken as string | undefined;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as { userId: string; role: string };
    const accessToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      ACCESS_SECRET,
      { expiresIn: ACCESS_TTL }
    );
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'TOKEN_EXPIRED' });
  }
}
