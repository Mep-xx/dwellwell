import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { homeId, brand, model, serialNumber, installedAt } = req.body ?? {};
  if (!homeId) return res.status(400).json({ error: 'VALIDATION_FAILED' });

  // Verify the home belongs to this user
  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

  // Only include fields we know exist on Trackable in your schema
  const data: any = { homeId };
  if (brand !== undefined) data.brand = brand;
  if (model !== undefined) data.model = model;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (installedAt !== undefined) data.installedAt = installedAt;

  const t = await prisma.trackable.create({ data });
  res.status(201).json(t);
});
