//dwellwell-api/src/routes/settings/routes.getNotifications.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const prefs = await prisma.notificationPreference.findMany({ where: { userId } });
  res.json(prefs);
});
