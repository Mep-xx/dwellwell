import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const {
    homeId,
    roomId,
    applianceCatalogId,
    userDefinedName,
    purchaseDate,   // ISO string (optional)
    serialNumber,
    notes,
  } = req.body ?? {};

  if (!homeId) return res.status(400).json({ error: 'VALIDATION_FAILED', message: 'homeId is required' });

  // Ensure the home belongs to this user
  const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
  if (!home) return res.status(404).json({ error: 'HOME_NOT_FOUND' });

  // If a room is set, it must belong to that home (and therefore to the user)
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, homeId } });
    if (!room) return res.status(400).json({ error: 'ROOM_NOT_FOUND_OR_NOT_IN_HOME' });
  }

  // If linking to a catalog entry, ensure it exists
  if (applianceCatalogId) {
    const exists = await prisma.applianceCatalog.findUnique({ where: { id: applianceCatalogId } });
    if (!exists) return res.status(400).json({ error: 'CATALOG_ID_INVALID' });
  }

  // Build data aligned to your Prisma model
  const data: any = { homeId };
  if (roomId !== undefined) data.roomId = roomId;
  if (applianceCatalogId !== undefined) data.applianceCatalogId = applianceCatalogId;
  if (userDefinedName !== undefined) data.userDefinedName = userDefinedName;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (notes !== undefined) data.notes = notes;
  if (purchaseDate) {
    const d = new Date(purchaseDate);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'INVALID_DATE', field: 'purchaseDate' });
    data.purchaseDate = d;
  }

  const created = await prisma.trackable.create({ data });
  res.status(201).json(created);
});
