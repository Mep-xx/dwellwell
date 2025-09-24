//dwellwell-api/src/routes/settings/routes.routeIcal.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id as string;
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: { icalFeedToken: crypto.randomUUID() },
    create: { userId, icalFeedToken: crypto.randomUUID() },
  });
  res.json({ icalFeedToken: settings.icalFeedToken });
});
