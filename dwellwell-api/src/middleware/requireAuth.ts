import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET: jwt.Secret = (process.env.JWT_SECRET || 'dev-secret') as jwt.Secret;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req as any).cookies?.accessToken;

  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as any;
    (req as any).user = { id: payload.userId, userId: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'TOKEN_EXPIRED' });
  }
}
