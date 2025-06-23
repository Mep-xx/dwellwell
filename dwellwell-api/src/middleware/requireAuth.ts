// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('🛡️ Auth header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⛔ Missing or malformed Authorization header');
    return res.status(401).json({ message: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ message: err.message || 'Unauthorized' });
  }
};

