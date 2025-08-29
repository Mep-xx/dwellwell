// src/middleware/requireAdmin.ts
import { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json({ message: 'UNAUTHORIZED' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};