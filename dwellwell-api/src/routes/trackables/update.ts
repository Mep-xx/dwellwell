import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  // Check ownership through the related Home
  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  // Whitelist updates to known fields
  const data: any = {};
  const { brand, model, serialNumber, installedAt, homeId } = req.body ?? {};
  if (brand !== undefined) data.brand = brand;
  if (model !== undefined) data.model = model;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (installedAt !== undefined) data.installedAt = installedAt;

  // If allowing reassignment to another home, verify ownership of that home too
  if (homeId !== undefined) {
    const newHome = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!newHome) return res.status(400).json({ error: 'HOME_NOT_FOUND_OR_NOT_OWNED' });
    data.homeId = homeId;
  }

  const updated = await prisma.trackable.update({ where: { id: trackableId }, data });
  res.json(updated);
});
