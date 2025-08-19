// src/middleware/requireAdmin.ts
import { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  const id = user?.userId;
  const role = user?.role;

  console.log('🔐 Checking admin access for user:', id);
  if (role !== 'admin') {
    console.warn(`⛔ User ${id ?? 'unknown'} does not have admin role (found: ${role})`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};
