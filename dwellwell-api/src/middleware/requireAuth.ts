// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log("🔐 Incoming Auth Header:", req.headers.authorization);

  const authHeader = req.headers.authorization;
  console.log("🔐 Incoming Auth Header:", authHeader);

  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
    (req as any).user = decoded; // 👈 using `as any` avoids type error
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
