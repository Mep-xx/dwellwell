// src/middleware/requireAuth.ts
import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⛔ Missing or malformed Authorization header:', authHeader);
    return res.status(401).json({ message: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Bearer token starts with:', typeof token === 'string' ? token.slice(0, 16) : token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId: string;
      role?: string;
    };

    (req as any).user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (err: any) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ message: err.message || 'Unauthorized' });
  }
};
