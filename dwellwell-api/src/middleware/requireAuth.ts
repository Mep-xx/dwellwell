// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  try {
    const decoded = verifyToken(token) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
