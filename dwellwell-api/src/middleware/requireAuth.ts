//dwellwell-api/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthedUser {
  id: string;
  role?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthedUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // Log what we’re about to verify
  try {
    const decoded: any = jwt.decode(token, { complete: true });
    const exp = decoded?.payload?.exp;
    const role = decoded?.payload?.role;
    const userId = decoded?.payload?.userId ?? decoded?.payload?.sub;
  } catch (e) {
    
  }

  try {
    // Allow a little skew so we don’t flap during refresh
    const payload = jwt.verify(token, ACCESS_SECRET, { clockTolerance: 5 }) as JwtPayload;
    const userId = (payload as any).userId ?? payload.sub;
    const role = (payload as any).role;
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
    req.user = { id: String(userId), role };
    return next();
  } catch (e: any) {
    const name = e?.name || 'VerifyError';
    const msg = e?.message || 'verify failed';
    if (e instanceof TokenExpiredError) {
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}
