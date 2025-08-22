import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const homes = await prisma.home.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(homes);
});
