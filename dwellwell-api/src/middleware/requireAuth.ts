// dwellwell-api/src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

type Role = 'user' | 'admin';
type TokenBody = JwtPayload & { userId: string; role: Role };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getTokenFromReq(req: Request): string | null {
  // Prefer Authorization header; fallback to cookie named "token"
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  const cookie = (req as any).cookies?.token;
  return cookie || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing token' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenBody;

    if (!payload?.userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token payload' });
    }

    (req as any).user = {
      userId: payload.userId,
      role: (payload.role as Role) || 'user',
    };

    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'JWT expired' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}

/**
 * Optional guard for admin-only routes. Call after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as any)?.user?.role as Role | undefined;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin only' });
  }
  next();
}
