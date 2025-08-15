import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  console.log('Authenticated user:', user);
  console.log(user);

  if (!user || user.role !== 'admin') {
    console.log('user is not admin');
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};
