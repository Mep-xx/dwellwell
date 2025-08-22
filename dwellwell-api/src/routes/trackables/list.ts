import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const homeId = (req.query.homeId as string) || undefined;

  const where: any = {
    home: { userId }, // ownership via related Home
  };
  if (homeId) where.homeId = homeId;

  const trackables = await prisma.trackable.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json(trackables);
});
