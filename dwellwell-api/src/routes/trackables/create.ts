import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const {
    homeId,            // optional
    roomId,            // optional
    applianceCatalogId,// optional
    userDefinedName,   // required client-side; optional server-side
    purchaseDate,      // optional ISO string
    serialNumber,      // optional
    notes,             // optional
    imageUrl,          // optional
  } = req.body ?? {};

  // If homeId is provided, verify it belongs to this user
  if (homeId) {
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) return res.status(400).json({ error: 'HOME_NOT_FOUND_OR_NOT_OWNED' });
    // If roomId is also provided, verify it belongs to that home
    if (roomId) {
      const room = await prisma.room.findFirst({ where: { id: roomId, homeId } });
      if (!room) return res.status(400).json({ error: 'ROOM_NOT_FOUND_OR_NOT_IN_HOME' });
    }
  }

  if (applianceCatalogId) {
    const exists = await prisma.applianceCatalog.findUnique({ where: { id: applianceCatalogId } });
    if (!exists) return res.status(400).json({ error: 'CATALOG_ID_INVALID' });
  }

  const data: any = {
    ownerUserId: userId,
  };

  if (homeId !== undefined) data.homeId = homeId;
  if (roomId !== undefined) data.roomId = roomId;
  if (applianceCatalogId !== undefined) data.applianceCatalogId = applianceCatalogId;
  if (userDefinedName !== undefined) data.userDefinedName = userDefinedName;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (notes !== undefined) data.notes = notes;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  if (purchaseDate) {
    const d = new Date(purchaseDate);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'INVALID_DATE', field: 'purchaseDate' });
    data.purchaseDate = d;
  }

  const created = await prisma.trackable.create({ data });
  res.status(201).json(created);
});
